import { BaseReporter } from "../reporter";
import { PageContext, LinkedData } from "../types";
import { uuid } from "../utils";

export interface PageInfo {
  name: string;
  extInfo: Record<string, any>;
}
export type PageManagerOptions = PageInfo;
export abstract class BasePageManager {
  public currentPage?: PageContext;
  public linkedData: Partial<LinkedData> = {
    contextId: uuid.generate()
  }
  protected constructor(protected reporter: BaseReporter, protected pageKey = '__nubra::page') {}

  /** 页面推入页面栈 */
  public async push(item: PageInfo, referElementId?: string) {
    const prevPage = await this.load();
    this.currentPage = prevPage
      ? {
          pageName: item.name,
          accessId: uuid.generate(),
          step: prevPage.step + 1,
          referAccessId: prevPage.accessId,
          referPageName: prevPage.pageName,
          referrer: prevPage.accessId,
          referElementId,
          extInfo: item.extInfo
        }
      : {
          pageName: item.name,
          accessId: uuid.generate(),
          step: 1,
          referAccessId: this.linkedData.referAcceccId,
          referElementId: this.linkedData.referElementId,
          referrer: this.linkedData.referrer,
          extInfo: item.extInfo
        }
    this.save();
  }

  /** 获取当前页面栈信息 */
  public getPageInfo() {
    if(!this.currentPage) {
      throw new Error('currentPage not found');
    }

    return this.currentPage;
  }

  /** 更新页面信息： extInfo */
  public updatePageInfo(extInfo?: Record<string, any>) {
    if(!this.currentPage) {
      this.reporter.errorHandler(new Error('current page not found'));
      return;
    }
    this.currentPage.extInfo = extInfo;
  }

  public async init(){
    this.initLinkedData();
    await this.load();
  }

  public getLinkedData(): Partial<LinkedData> {
    return {
      entranceId: this.linkedData?.entranceId,
      contextId: this.linkedData.contextId,
      referrer: this.linkedData?.referrer,
      referAcceccId: this.currentPage?.referAccessId,
      referElementId: this.currentPage?.referElementId
    }
  }

  get contextId() {
    return this.linkedData.contextId;
  }

  protected getStorageKey(contextId: string | undefined = this.contextId) {
    return `${this.pageKey}__${contextId || ''}`;
  }

  /** 读取页面栈，取得上一个页面 */
  public abstract load(): Promise<PageContext | undefined>;
  
  /** 保存页面栈，将当前页面存入 */
  protected abstract save(): Promise<void>;

  protected abstract initLinkedData();
  protected abstract updateLinkedData();
}