import { WebReporter, WebErrorCollector, ReportItemType, parseStackToLine } from "nubra-common";
import Vue, { VueConstructor } from "vue";
import { VueErrorInfo } from "./types";

interface VueErrorCollectorOptions {
  app: VueConstructor<Vue>;
}
export class VueErrorCollector extends WebErrorCollector {
  app: VueConstructor<Vue>;
  constructor(options: VueErrorCollectorOptions) {
    super();
    this.app = options.app;
  }
  init(reporter: WebReporter) {
    super.init(reporter);
    const oldErrorHandler = this.app.config.errorHandler;
    this.app.config.errorHandler = (err, vm, info) => {
      oldErrorHandler?.(err, vm , info);
      let targetErr;
      if(!(err instanceof Error)) {
        targetErr = typeof err === "string" ? new Error(err) : new Error(String(err));
      }else {
        targetErr = err;
      }
      this.reporter?.report<VueErrorInfo>({ type: ReportItemType.runtimeError, data: {  
        stack: parseStackToLine(targetErr?.stack),
        messgae: targetErr?.messgae
      } })
    }
  }
}