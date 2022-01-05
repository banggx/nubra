import { BaseBehaviorCatch } from "./behaviorCatch";

export class BehaviorCatcherMap<EL extends HTMLElement, T extends BaseBehaviorCatch<EL>> {
  catcherMap = new Map<EL, T>();
  constructor(private Catcher: new (...args) => T) {}
  
  /** 将元素注册到catcherMap, 或者更新extInfo */
  register(el: EL, extInfo?: Record<string, any>, config?: Record<string, any>) {
    const catcher = this.catcherMap.get(el);
    if(catcher) {
      catcher.updateExtInfo(extInfo);
      config && catcher.updateConfig(config);
      return catcher;
    }
    const newCatcher = new this.Catcher({ el, extInfo, ...config });
    this.catcherMap.set(el, newCatcher);
    return newCatcher;
  }

  /** 注销catcher, 既从map中删除，同时destroy catcher */
  disRegister(el: EL) {
    const catcher = this.catcherMap.get(el);
    if(!catcher) return;
    catcher.destroy();
    this.catcherMap.delete(el);
  }

  /** 通过el拿到catcher */
  get(el: EL) {
    return this.catcherMap.get(el);
  }

  /** 判断是否存在el对应的catcher */
  has(el: EL) {
    return this.catcherMap.has(el);
  }

  /** 通过catcher字段拿到catcher */
  find(predicate: (value: T) => boolean) {
    for(const catcher of this.catcherMap.values()) {
      if(predicate(catcher)) return catcher;
    }
    return undefined;
  }

  /** 销毁所有的catcher */
  settle(){
    this.catcherMap.forEach((catcher, el) => {
      catcher.destroy();
      this.catcherMap.delete(el);
    })
  }
}