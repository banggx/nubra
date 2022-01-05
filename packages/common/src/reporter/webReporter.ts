import { BaseReporter, BaseReporterOptions } from "./baseReporter";
import { WebPageManager } from "../pageManager";
import qs from "qs";

function hump2Underline(s: string) {
  if (/^[A-Z]/.test(s)) return s;
  return s.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export class WebReporter extends BaseReporter {
  pageManager: WebPageManager;
  constructor(options: BaseReporterOptions) {
    super(options);
    this.pageManager = new WebPageManager({ reporter: this, pageKey: options.pageKey, storage: this.storage })
    window.addEventListener('pagehide', () => {
      this.settle().then(() => {
        this.log('清算结束。');
      })
    })
  }

  initHostInfo() {
    this.hostInfo.browser = window.navigator.userAgent;
    this.hostInfo.clientHeight = window.innerHeight;
    this.hostInfo.clientWidth = window.innerWidth;
    this.hostInfo.screenHeight = screen.availHeight;
    this.hostInfo.screenWidth = screen.availWidth;
    this.hostInfo.lang = window.navigator.language.slice(0, 2);
    this.hostInfo.location = location.href;
    this.hostInfo.network = {
      type: navigator.connection.type,
      downlink: (navigator.connection as any)?.downlink,
      effectiveType: (navigator.connection as any)?.effectiveType,
      rtt: (navigator.connection as any)?.rtt
    };
  }

  updateHostInfo(){
    this.hostInfo.clientHeight = window.innerHeight;
    this.hostInfo.clientWidth = window.innerWidth;
    this.hostInfo.location = location.href;
  }

  getLinkedDataQuery(): string {
    const nextLinkData = this.pageManager.getLinkedData();
    return qs.stringify(nextLinkData, {
      encoder: (str, defualtEncoder, charset, type) => {
        if (type === 'key') {
          return hump2Underline(str);
        }
        return str;
      },
    });
  }
}