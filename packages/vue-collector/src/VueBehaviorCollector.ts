import { WebReporter, WebBehaviorCollector, ReportItemType } from "nubra-common";
import Vue, { VueConstructor } from "vue";
import { App } from "@vue/runtime-core";
import VueRouter from "vue-router";
import { registerClickDirective, registerExposeDirective, registerExposeRootDirective, registerHoverDirective } from "./directive";
import { isAllRouteHaveName } from "./utils";
import { PageLeaveInfo, PageEnterInfo } from "./types";

interface VueBehaviorCollectorOptions {
  app: VueConstructor<Vue> | App;
  router?: VueRouter;
}

export class VueBehaviorCollector extends WebBehaviorCollector {
  private app: VueConstructor<Vue> | App;
  private router?: VueRouter;
  private routerDepth = 0;
  constructor(options: VueBehaviorCollectorOptions) {
    super();
    this.app = options.app;
    this.router = options.router;
  }

  init(reporter: WebReporter) {
    super.init(reporter)
    this.registerExpose();
    this.registerClick();
    this.registerHover();
    this.registerPage();
  }

  destroy(){
    super.destroy();
  }

  registerExpose() {
    registerExposeDirective(this.app, this);
    registerExposeRootDirective(this.app, this);
    this.kickAllExposeRoot();
  }

  registerClick(){
    registerClickDirective(this.app, this);
  }

  registerHover(){
    registerHoverDirective(this.app, this);
  }

  registerPage(){
    if(!this.router) return;
    if(!isAllRouteHaveName(this.router)) {
      throw new Error('every route in Vue-Router must have a name');
    }
    this.router.afterEach(async (to, from) => {
      let enterTime;
      let currentTime = Date.now();
      sessionStorage.setItem(to.name as string, currentTime.toString());
      if(from?.name) {
        enterTime = sessionStorage.getItem(from.name);
      } else {
        enterTime = currentTime;
      }
      const stayTime = currentTime - parseFloat(enterTime);
      const prevPage = await this.reporter?.pageManager.load();
      if(prevPage) {
        this.reporter?.report<PageLeaveInfo>({ type: ReportItemType.pageLeave, data: { pageName: from?.name as string, stayTime: stayTime } })
      }
      const eleId = Array.isArray(to.query?.ref_element_id) ? to.query.ref_element_id[0] : to.query.ref_element_id;
      const nubra = to?.meta?.nubra as null | {
        pageId: string;
        extInfo: Record<string, any>;
      }
      const pageInfo = {
        name: nubra?.pageId ?? to.name as string,
        extInfo: {
          ...to.params,
          ...to.query,
          ...nubra?.extInfo
        }
      }
      await this.reporter?.pageManager.push(pageInfo, eleId ?? '');
      this.routerDepth = this.routerDepth + 1;
      this.reporter?.report<PageEnterInfo>({ type: ReportItemType.pegeEnter, data: { pageName: to?.name as string, enterTime: currentTime } });
    })
  }
}