import { Collector } from "./baseCollector";
import { BaseReporter } from "../reporter";
import { GlobalErrorInfo, ReportItemType, PromiseRejectInfo } from "../types";
import { parseStackToLine } from "./utils";

export class WebErrorCollector extends Collector<BaseReporter> {
  init(reporter: BaseReporter) {
    super.init(reporter);
    window.addEventListener("error", this.globalErrorHijackHandler.bind(this), true);
    window.addEventListener('unhandledrejection', this.promiseErrorHijackHandler.bind(this), true);
  }

  destroy(){
    window.removeEventListener('error', this.globalErrorHijackHandler.bind(this), true);
    window.removeEventListener('unhandledrejection', this.promiseErrorHijackHandler.bind(this), true);
    super.destroy();
  }

  /** 全局错误捕获处理 */
  public globalErrorHijackHandler(event: ErrorEvent) {
    const reportData: GlobalErrorInfo = {
      filename: (event.target as any).src || (event.target as any).href,
      position: `line: ${event.lineno}; col: ${event.colno}`,
      stack: parseStackToLine(event.error.stack),
      message: event.message
    }
    /** 静态资源家在错误 */
    if(event.target && ((event.target as any).src || (event.target as any).href)) {
      this.reporter?.report<GlobalErrorInfo>({ type: ReportItemType.staticError, data: reportData });
      return;
    }
    this.reporter?.report<GlobalErrorInfo>({ type: ReportItemType.runtimeError, data: reportData })
  }

  /** promise异步错误捕获处理 */
  public promiseErrorHijackHandler(event: PromiseRejectionEvent) {
    const reportData: PromiseRejectInfo = {};
    if(typeof event.reason === "string") {
      reportData.message = event.reason;
    }
    if(typeof event.reason === "object") {
      reportData.message = event.reason?.message;
      if(event.reason?.stack) {
        let matchResult = event.reason.stack.match(/at\s+(.+):(\d+):(\d+)/);
        reportData.filename = matchResult?.[1];
        reportData.position = `line: ${matchResult?.[2]}; col${matchResult?.[3]}`;
      }
    }
    this.reporter?.report<PromiseRejectInfo>({ type: ReportItemType.asyncError, data: reportData })
  }
}