import Vue, { VueConstructor } from "vue";
import { App } from "@vue/runtime-core";
import { WebBehaviorCollector } from "nubra-common";

export const registerExposeRootDirective = (app: VueConstructor<Vue> | App, webBehaviorCollector: WebBehaviorCollector) => {
  app.directive('nubra-exposeRoot', {
    inserted: (el, binding) => {
      const exposeConfig = binding.value;
      const name = binding.arg as string;
      webBehaviorCollector.exposeRoot(el, {
        name,
        exposeConfig
      })
    },
    unbind: (el) => {
      webBehaviorCollector.deleteExposeRoot(el);
    }
  })
}