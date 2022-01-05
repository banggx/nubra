import { Collector } from "./baseCollector";
import { BaseReporter } from "../reporter";
import { AjaxInfo, ReportItemType } from "../types";

export class WebAjaxCollector extends Collector<BaseReporter> {
  cacheXMLHttpRequest: Partial<XMLHttpRequest> = {};
  cacheFetch?: typeof window.fetch;
  init(reporter: BaseReporter) {
    super.init(reporter);
    this.injectXHR();
    this.hijackFetch();
  }

  destroy(){
    super.destroy();
    const XMLHttpRequest = window.XMLHttpRequest;
    XMLHttpRequest.prototype.open = this.cacheXMLHttpRequest.open || XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.send = this.cacheXMLHttpRequest.send || XMLHttpRequest.prototype.send;
    window.fetch = this.cacheFetch || window.fetch;
  }

  /** XHR对象劫持，注入捕获逻辑 */
  public injectXHR() {
    const that = this;
    const XMLHttpRequest = window.XMLHttpRequest;
    this.cacheXMLHttpRequest.open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string, async?: boolean) {
      if(!url.match(/logstores/)) {
        Reflect.set(this, 'logData', { method, url, async })
      }
      return that.cacheXMLHttpRequest.open?.apply(this, arguments as any)
    }
    this.cacheXMLHttpRequest.send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit) {
      const logData = Reflect.get(this, 'logData');
      if(logData) {
        const startTime = Date.now();
        const handler = (type: string) => (event: Event) => {
          const reportData: AjaxInfo = {
            duration: Date.now() - startTime,
            status: this.status,
            statusText: this.statusText,
            eventType: type,
            path: logData.url,
            response: this.response ? JSON.stringify(this.response) : "",
            params: JSON.stringify(body) || ""
          }
          that.reporter?.report({ type: ReportItemType.ajax, data: reportData })
        }
        this.addEventListener("load", handler("load"), false)
        this.addEventListener("error", handler("error"), false)
        this.addEventListener("abort", handler("abort"), false)
      }
      return that.cacheXMLHttpRequest.send?.apply(this, arguments as any);
    }
  }

  /** 劫持fetch方法 */
  public hijackFetch() {
    const that = this;
    const oldFetch = window.fetch;
    this.cacheFetch = oldFetch;
    window.fetch = function(input: RequestInfo, init?: RequestInit): Promise<Response> {
      const startTime = Date.now();
      return oldFetch.call(this, arguments as any).then(async res => {
        const response = await res.json();
        const reportData: AjaxInfo = {
          duration: Date.now() - startTime,
          status: res.status,
          statusText: res.statusText,
          eventType: 'load',
          path: typeof input === 'string' ? input : input.url,
          params: init ? JSON.stringify(init?.body) : "",
          response: JSON.stringify(response)
        }
        that.reporter?.report<AjaxInfo>({ type: ReportItemType.ajax, data: reportData });
        return res;
      })
    }
  }
}