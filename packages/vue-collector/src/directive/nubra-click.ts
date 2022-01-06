import Vue, { VueConstructor } from "vue";
import { App } from "@vue/runtime-core";
import { WebBehaviorCollector } from "nubra-common";

export const registerClickDirective = (app: VueConstructor<Vue> | App, webBehaviorCollector: WebBehaviorCollector) => {
  app.directive('nubra-click', {
    inserted: (el, _, vnode) => {
      const extInfo = vnode?.data?.attrs?.['nubra-extends'];
      webBehaviorCollector.click(el, extInfo)
    },
    componentUpdated: (el, binding, vnode, _oldVnode) => {
      const extInfo = vnode?.data?.attrs?.['nubra-extends'];
      webBehaviorCollector.click(el, extInfo)
    }
  })
}