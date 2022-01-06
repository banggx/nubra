import Vue, { VueConstructor } from "vue";
import { App } from "@vue/runtime-core";
import { WebBehaviorCollector } from 'nubra-common';

export const registerExposeDirective = (app: VueConstructor<Vue> | App, webBehaviorCollector: WebBehaviorCollector) => {
  app.directive('nubra-expose', {
    inserted: (el, binding, vnode) => {
      const extInfo = vnode?.data?.attrs?.['nubra-extends'];
      const rootName = binding?.arg;
      webBehaviorCollector.expose(el, {
        extInfo,
        rootName
      })
    },
    componentUpdated: (el, binding, vnode) => {
      const extInfo = vnode?.data?.attrs?.['nubra-extends'];
      const rootName = binding?.arg;
      webBehaviorCollector.expose(el, {
        extInfo,
        rootName
      })
    },
    unbind: (el) => {
      webBehaviorCollector.cancelExposureByElement(el);
    }
  })
}