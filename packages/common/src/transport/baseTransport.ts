import { BaseReporter } from "../reporter";
import { ReportItem, BaseReportItem } from "../types";

export abstract class Transport<Reporter extends BaseReporter> {
  protected reporter?: Reporter;

  /** 上报传输类初始化 */
  async init(reporter: Reporter): Promise<void> {
    this.reporter = reporter;
    return;
  }

  /** 数据上传方法 */
  public reportData(url: string, records: ReportItem<BaseReportItem>[]) {
    if(typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(url, JSON.stringify(records));
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.width = 1;
    img.height = 1;
    img.src = `${url}${url.indexOf('?') !== -1 ? '&' : '?'}${JSON.stringify(records)}`;
  }

  /** 实际传输上报方法 */
  abstract send(records: any[]);
}