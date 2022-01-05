import { BaseBehaviorCatchConfig } from "../../types"
import { getElementKey } from "../utils";

export abstract class BaseBehaviorCatch<EL extends HTMLElement> {
  el: EL;
  extInfo?: Record<string, any>;
  key: string;
  constructor(config: BaseBehaviorCatchConfig<EL>) {
    this.el = config.el;
    this.extInfo = config.extInfo;
    this.key = getElementKey(config.el);
  }
  
  updateExtInfo(info?: Record<string, any>) {
    this.extInfo = info;
  }

  abstract updateConfig(config: Record<string, any>);
  abstract destroy();
}