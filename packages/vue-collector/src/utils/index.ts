import VueRouter, { RouteConfig, RouterOptions } from "vue-router";

export const getElementKey = (el: HTMLElement): string => {
  if(!el) return '';
  const attrValue = el.getAttribute('nubra-key');
  if(attrValue) return attrValue;
  const dataValue = el.dataset.nubraKey;
  if(dataValue) return dataValue;
  return '';
}

export const isAllRouteHaveName = (router: VueRouter) => {
  const tempRouter = router as VueRouter & {
    options: RouterOptions;
  }
  const { options } = tempRouter;
  let res = true;
  const helper = (routeConfig: RouteConfig) => {
    if(!res) return;
    if(!routeConfig.name) {
      res = false;
      return;
    }
    if(routeConfig.children) {
      routeConfig.children.forEach(route => helper(route))
    }
  }
  if(options?.routes) {
    options.routes.forEach(route => helper(route));
  }
  return res;
}