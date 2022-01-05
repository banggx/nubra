import { BaseBehaviorCatch } from "./baseBehaviorCatch";
import { BaseBehaviorCatchConfig, DOMDatasetBoolean, ExposeHTMLElement } from "../../types";
import { ExposeCatch } from "./exposeCatch";

interface ExposeRootConfig extends BaseBehaviorCatchConfig<ExposeHTMLElement> {
  name?: string;
  observer: IntersectionObserver;
}

export class ExposeRootCatch extends BaseBehaviorCatch<ExposeHTMLElement> {
  name?: string;
  observer?: IntersectionObserver;
  exposeTarget?: ExposeCatch[];
  constructor(config: ExposeRootConfig) {
    super(config);
    this.updateConfig(config);
  }

  updateConfig(config: ExposeRootConfig) {
    this.name = config.name;
    this.exposeTarget = [];
    this.observer = config.observer;
    this.el.dataset.isExposeRoot = DOMDatasetBoolean.true;
    if(config.name) this.el.dataset.name = config.name;
  }

  unObserver(target: ExposeCatch) {
    this.observer?.unobserve(target.el);
    const targetIndex = this.exposeTarget?.findIndex(item => item === target) as number;
    if(targetIndex >= 0) {
      this.exposeTarget?.splice(targetIndex, 1);
    }
  }

  observe(target: ExposeCatch) {
    /** 如果当前已经被观测，则直接中断 */
    if((this.exposeTarget?.findIndex((item) => item.el === target.el) as number) >= 0)  return;
    this.observer?.observe(target.el);
    this.exposeTarget?.push(target);
  }

  destroy(){
    this.observer?.disconnect();
    this.exposeTarget = [];
    this.el.dataset.isExposeRoot = DOMDatasetBoolean.false;
    this.el.dataset.name = '';
  }
}