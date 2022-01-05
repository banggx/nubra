import { Collector } from "../collector";
import { Transport } from "../transport";
import { BasePageManager } from "../pageManager";
import { Storage, LocalStorage } from "../storage";
import { HostContext, BaseReportItem, ReportItem, ReportItemType } from "../types";

const ErrorType = [ReportItemType.staticError, ReportItemType.runtimeError, ReportItemType.asyncError, ReportItemType.ajax]
export interface BaseReporterOptions {
  collectors?: Collector<any>[];                          /** 搜集器列表 */
  transports?: Transport<any>[];                          /** 传输器列表 */
  bufferSize?: number;                                    /** buffer缓冲区大小 */
  batchSize?: number;                                     /** 批量缓冲大小: 默认为0 */
  pageStackStorageLimit?: number;                         /** 缓存页面栈数量 */
  debugMode?: boolean;                                    /** debug模式 */
  errorHandler?: (err: Error, detail?: Record<string, any>) => void;    /** error捕获处理，默认debug模式打印 */
  storage?: Storage;                                      /** 缓存存储的实例对象 */
  pageKey?: string;                                       /** 页面控制的key，默认为__nurbra::page */
}

interface ReporterInitOptions {
  user: any;
}

export abstract class BaseReporter {
  public bufferSize: number;
  private batchSize: number;
  public hostInfo: HostContext = {};
  public userInfo: any = {};
  public pageStackStorageLimit: number;
  public debugMode: boolean;
  public errorHandler: (err: Error, detail?: Record<string, any>) => void;
  private collectors: Collector<any>[];
  private transports: Transport<any>[];
  public storage?: Storage;
  private buffer: ReportItem<BaseReportItem>[] = [];
  private batch: number = 0;

  public abstract pageManager: BasePageManager;
  
  protected constructor(public options: BaseReporterOptions) {
    this.collectors = options.collectors || [];
    this.transports = options.transports || [];
    this.bufferSize = options.bufferSize || 50;
    this.batchSize = options.batchSize || 0;
    this.pageStackStorageLimit = options.pageStackStorageLimit || 5;
    this.debugMode = options.debugMode || false;
    this.storage = options.storage || new LocalStorage();
    this.errorHandler = options.errorHandler
      || ((err, detail) => console.error('[Nubra ERROR]', { stack: err?.stack, msg: err.message, detail }));
  }

  public reportByTransports(records: ReportItem<BaseReportItem>[]) {
    return Promise.all(this.transports.map(transport => transport.send(records)));
  }

  public log(...args: Parameters<typeof console.log>) {
    this.debugMode && console.log('[Nubra DEBUG]', ...args);
  }

  private get getBatchCacheBaseKey() {
    return `__nubra::report-batch-`;
  }

  private getContext() {
    return {
      page: this.pageManager.getPageInfo(),
      host: this.hostInfo
    }
  }

  public async report<T>(data: BaseReportItem<T>) {
    try {
      const reportData: ReportItem<BaseReportItem> = { 
        ctime: Date.now(), 
        type: data.type, 
        data: data.data,
        context: this.getContext()
      };
      this.buffer.push(reportData);

      /** 未达到当前buffer的缓存上限，直接终止 */
      if(this.buffer.length < this.bufferSize) return;
      /** :::缓存已满::: */
      /** 当前storage对象不存在 或者 batchSize = 0，直接flush清空缓存 */
      if(!this.storage || !this.batchSize) {
        await this.flush();
        return;
      }

      /** 存在多batch缓存且当前缓存批次未达到上限时，写入Storage缓存 */
      if(this.batchSize > 0 && this.batch < this.batchSize) {
        this.log(`开启第 ${this.batch} 次缓存`);
        const cacheKey = this.getBatchCacheBaseKey + this.batch;
        await this.storage.setItem(cacheKey, this.buffer);
        this.buffer.length = 0;
        this.batch++;
        return;
      }

      /** 存在多batch缓存，且当前已经达到缓存上限时，开始读取所有缓存数据进行上报 */
      if(this.batch >= this.batchSize) {
        this.log(`多批缓存结束，执行缓存flush`);
        const batchCacheReport = await Promise.all(new Array(this.batch).fill(0).map(async (_, index) => {
          const currentCacheKey = this.getBatchCacheBaseKey + index;
          const cacheReport = await this.storage?.getItem<any[]>(currentCacheKey, []);
          await this.storage?.removeItem(currentCacheKey);
          return cacheReport;
        }));
        const allCacheReport = batchCacheReport.reduce((prev: any[], cur) => {
          return prev?.concat(cur);
        }, this.buffer);
        this.buffer = allCacheReport;
        this.batch = 0;
        await this.flush();
        return;
      }
    } catch(err) {
      this.errorHandler(err as Error, data)
    }
  }

  public async flush() {
    if(!this.buffer.length) return;
    const buffer = [...this.buffer].map(record => ({ ...record, user: this.userInfo }));
    this.buffer.length = 0;
    await this.reportByTransports(buffer);
  }

  public init(options: ReporterInitOptions) {
    try {
      this.userInfo = options.user;
      this.initHostInfo();
      this.pageManager.init();
      this.transports.forEach(transport => transport.init(this));
      this.collectors.forEach(collector => collector.init(this));
    } catch(err) {
      this.debugMode && this.errorHandler(err as Error);
    }
  }

  public async settle() {
    try {
      this.collectors.forEach(collector => collector.destroy());
      await this.flush();
    }catch(err) {
      this.errorHandler(err as Error);
    }
  }

  protected abstract updateHostInfo();
  protected abstract initHostInfo();
}