import { BasePageManager } from "./basePageManager";
import { WebReporter } from "../reporter";
import { Storage } from "../storage";
import { parseLocationQuery } from "../utils";

export interface WebPageManagerOptions {
  reporter: WebReporter;
  pageKey?: string;
  storage?: Storage;
}
export class WebPageManager extends BasePageManager {
  storage: Storage | undefined;
  query: Record<string, any>;
  constructor(options: WebPageManagerOptions) {
    super(options.reporter, options.pageKey || '__nubra::page');
    this.query = parseLocationQuery();
    this.storage = options.storage;
  }
  async init(){
    await super.init();
  }

  public async load() {
    if(!this.storage) return undefined;
    const contextIdQueue = await this.storage.getItem<string[]>(this.pageKey, []);
    this.storage.iterator(async (key: string) => {
      if(key.startsWith(`${this.pageKey}_`) && !contextIdQueue.includes(key.replace(`${this.pageKey}_`, ''))) {
        this.reporter.log('删除历史遗留页面栈.');
        await this.storage?.removeItem(key);
      }
    })
    return this.storage.getItem(this.getStorageKey(this.contextId), undefined);
  }

  protected async save() {
    if(!this.storage || !this.currentPage || !this.contextId) return;
    try {
      /** 页面栈队列 */
      const contextIdQueue = await this.storage.getItem<string[]>(this.pageKey, []);
      this.reporter.log('读取回收队列');
      /** 若当前 contextId 已存在于队列中，更新对应值后放到队尾 */
      if(contextIdQueue.includes(this.contextId)) {
        /** 若当前 contextId 不在队尾，将其移动到队尾 */
        if(contextIdQueue.indexOf(this.contextId) !== contextIdQueue.length - 1) {
          contextIdQueue.splice(contextIdQueue.indexOf(this.contextId), 1);
          contextIdQueue.push(this.contextId);
          this.reporter.log('当前contextId更新至队尾：', this.contextId);
          await this.storage.setItem(this.pageKey, contextIdQueue);
        }
      } else {
        /** 页面栈超出最大上限，队首出队 */
        if(contextIdQueue.length >= this.reporter.pageStackStorageLimit) {
          const contextIdToBeRemoved = contextIdQueue.shift();
          if(contextIdToBeRemoved) {
            this.reporter.log('存储超出上限，出队: ', contextIdToBeRemoved);
            await this.storage.removeItem(this.getStorageKey(contextIdToBeRemoved));
          }
        }
        /** 加入新的contextId，并跟新队列 */
        contextIdQueue.push(this.contextId);
        this.reporter.log('更新页面栈队列', contextIdQueue);
        await this.storage.setItem(this.pageKey, contextIdQueue);
      }
      this.reporter.log('写入新的contextId: ', this.contextId);
      await this.storage.setItem(this.getStorageKey(this.contextId), {
        name: this.currentPage.pageName,
        accessId: this.currentPage.accessId,
        step: this.currentPage.step,
        referrer: this.currentPage.referrer,
        referAccessId: this.currentPage.referAccessId,
        referElementId: this.currentPage.referElementId,
        referPageName: this.currentPage.referPageName
      })
    } catch (err: any) {
      if(err?.code === DOMException.QUOTA_EXCEEDED_ERR || err?.message?.toLowerCase().includes('quota')){
        /** 处理 storage 满了的情况：强制将队列减半，以防阻塞业务中 localStorage 的使用(主要针对localStorage) */
        const contextIdQueue = await this.storage.getItem(this.pageKey, []);
        const remain = Math.floor(contextIdQueue.length / 2);
        const newContextIdQueue = this.recycleLocalStorage(contextIdQueue, remain);
        await this.storage.setItem(this.pageKey, newContextIdQueue);
      }
    }
  }

  /** 回收 localStorage 中的页面栈，保留最近 remainCount 项 */
  private recycleLocalStorage(contextIdQueue: string[], remainCount: number) {
    this.reporter.log('回收页面栈开始，当前队列长度: ', contextIdQueue.length);
    const newContextIdQueue = [...contextIdQueue];
    const contextIdsToRemove = newContextIdQueue.splice(remainCount);
    contextIdsToRemove.forEach(async contextId => {
      this.reporter.log('删除页面栈：', contextId);
      await this.storage?.removeItem(this.getStorageKey(contextId));
    });
    this.reporter.log('回收页面栈结束，当前队列长度:', newContextIdQueue.length);
    return newContextIdQueue;
  }

  initLinkedData() {
    const { query } = this;
    if(query?.context_id) {
      this.linkedData.contextId = query?.context_id;
    }
    this.linkedData.entranceId = query.entrance_id;
    this.linkedData.referAcceccId = query.ref_access_id;
    this.linkedData.referElementId = query.ref_element_id;
    this.linkedData.referrer = document.referrer;
  }

  updateLinkedData() {
    this.query = parseLocationQuery();
    this.initLinkedData();
  }
}