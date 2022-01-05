import { uuid } from "../../utils";
import { BaseBehaviorCatch } from "./baseBehaviorCatch";
import { ExposeRootCatch } from "./exposeRootCatch";
import { ReportItemType, BaseBehaviorCatchConfig, ExposeHTMLElement, ReporterContext, DOMDatasetBoolean, ElementExposeInfo } from "../../types";


interface ExposeCatchConfig extends BaseBehaviorCatchConfig<ExposeHTMLElement> {
  originRootName: string;
  context?: ReporterContext;
}

export class ExposeCatch extends BaseBehaviorCatch<ExposeHTMLElement> {
  exposeId: string = uuid.generate();
  originRootName?: string;
  finalExposeRoot?: ExposeRootCatch;
  context?: ReporterContext;
  protected isExposing = false;
  protected lastExposeTime = 0;     /** 上一次触发曝光事件戳 */
  constructor(config: ExposeCatchConfig) {
    super(config);
    this.context = config.context;
    this.originRootName = config.originRootName;
    if(config.originRootName) {
      this.el.dataset.exposeRootName = config.originRootName;
    }
    this.el.dataset.isExposeTarget = DOMDatasetBoolean.true;
  }

  /** 获取曝光相对根节点 */
  getCurrentExposeRootElement(): ExposeHTMLElement | null {
    const helper = (el: ExposeHTMLElement) => {
      const parent = (el.parentElement || el.parentNode) as ExposeHTMLElement;
      if(!parent) return null;
      if(parent === document.body) return parent;
      return parent?.dataset?.isExposeRoot ? parent : helper(parent);
    }
    return helper(this.el);
  }

  setExposeRoot(exposeRoot: ExposeRootCatch) {
    this.finalExposeRoot = exposeRoot;
  }

  setKey(key: string){
    this.key = key;
  }

  updateConfig(config: ExposeCatchConfig){
    this.originRootName = config.originRootName;
    if(config.originRootName) {
      this.el.dataset.exposeRootName = config.originRootName;
    }
    this.el.dataset.isExposeTarget = DOMDatasetBoolean.true;
  }

  /** 触发组件曝光 */
  handleExpose() {
    this.isExposing = true;
    this.lastExposeTime = Date.now();
  }

  /** 曝光结束时 */
  settleExpose() {
    if(this.lastExposeTime === 0 || !this.isExposing) return;
    /** 曝光时常 */
    const exposeDuration = Date.now() - this.lastExposeTime; 
    /** 本次曝光时的id */
    const settleExposeId = this.exposeId;
    this.exposeId = uuid.generate();
    this.lastExposeTime = 0;
    this.isExposing = false;
    return { exposeDuration, exposeId: settleExposeId }
  }

  destroy(){
    /** 若destroy时候还在曝光，则强制曝光结束 */
    if(this.lastExposeTime && this.isExposing) {
      const settleData = this.settleExpose();
      if(settleData) {
        this.context?.reporter?.report<ElementExposeInfo>({ 
          type: ReportItemType.elementExpose, 
          data: {
            key: this.key,
            exposeId: settleData.exposeId,
            extInfo: this.extInfo,
            exposeTime: settleData.exposeDuration
          } 
        })
      }
    }
  }
}