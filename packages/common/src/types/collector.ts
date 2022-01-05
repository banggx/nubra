import { BaseReporter } from "../reporter";

export interface BaseBehaviorCatchConfig<EL extends HTMLElement> {
  el: EL;
  extInfo?: Record<string, any>
}

export enum DOMDatasetBoolean {
  true = 'true',
  false = 'false'
}

export interface ExposeHTMLElement extends HTMLElement {
  dataset: {
    name?: string;
    exposeRootName?: string;
    isExposeTarget?: string;
    isExposeRoot?: string;
  }
}

export interface ReporterContext {
  reporter?: BaseReporter
}

/** 全局错误信息 */
export interface GlobalErrorInfo {
  filename: string;
  position: string;
  stack: string;
  message: string;
}

/** promise错误信息 */
export interface PromiseRejectInfo {
  message?: string;
  filename?: string;
  position?: string;
}

/** ajax捕获上报信息 */
export interface AjaxInfo {
  duration: number;
  status: number;
  statusText: string;
  path: string;
  eventType: string;
  response?: string;
  params?: string;
}

/** expose曝光上报信息 */
export interface ElementExposeInfo {
  key: string;
  extInfo?: Record<string, any>;
  exposeId: string;
  exposeTime: number;
}

/** hover上报信息 */
export interface ElementHoverInfo {
  key: string;
  hoverTime: number;
}

/** click上报事件 */
export interface ElementClickInfo {
  key: string;
  extInfo?: Record<string, any>;
}
