import Vue, { VueConstructor } from "vue";
import { App } from "@vue/runtime-core";
import { WebBehaviorCollector } from "nubra-common";

export const registerHoverDirective = (app: VueConstructor<Vue> | App, webBehaviorCollector: WebBehaviorCollector) => {
  app.directive('nubra-hover', {
    inserted: (el, _, vnode) => {
      const extInfo = vnode?.data?.attrs?.['nubra-extends'];
      webBehaviorCollector.hover(el, extInfo);
    },
    componentUpdated: (el, _, vnode) => {
      const extInfo = vnode?.data?.attrs?.['nubra-extends'];
      webBehaviorCollector.hover(el, extInfo);
    },
    unbind: (el) => {
      webBehaviorCollector.deleteHover(el);
    }
  })
}