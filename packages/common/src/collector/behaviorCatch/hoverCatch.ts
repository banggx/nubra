import { BaseBehaviorCatch } from "./baseBehaviorCatch";
import { ReportItemType, BaseBehaviorCatchConfig, ReporterContext, ElementHoverInfo } from "../../types";

export interface HoverCatchConfig extends BaseBehaviorCatchConfig<HTMLElement> {
  context: ReporterContext;
}
export enum HoverState {
  enter,
  leave
}

export class HoverCatch extends BaseBehaviorCatch<HTMLElement> {
  state: HoverState = HoverState.leave;
  context: ReporterContext;
  enterTime: number = 0;
  mouseEnter: (event: MouseEvent) => void;
  mouseLeave: (event: MouseEvent) => void;
  constructor(config: HoverCatchConfig) {
    super(config);
    this.context = config.context;
    this.mouseEnter = this.privateMouseEnter.bind(this);
    this.mouseLeave = this.privateMouseLeave.bind(this);
    this.listen();
  }

  public listen(){
    this.el.addEventListener('mouseenter', this.mouseEnter);
    this.el.addEventListener('mouseleave', this.mouseLeave);
  }
  updateConfig(){}
  destroy() {
    this.el.removeEventListener('mouseenter', this.mouseEnter);
    this.el.removeEventListener('mouseleave', this.mouseLeave);
  }

  private privateMouseEnter() {
    if(this.state === HoverState.enter) {
      this.state = HoverState.leave;
      throw new Error(`[Nubra Error] ${this.key} hover catcher error`);
    }
    this.state = HoverState.enter;
    this.enterTime = Date.now();
  }

  private privateMouseLeave() {
    if(this.state === HoverState.leave) {
      throw new Error(`[Nubra Error] ${this.key} hover catcher error`);
    }
    if(!this.enterTime) return;
    this.context.reporter?.report<ElementHoverInfo>({
      type: ReportItemType.elementHover,
      data: {
        key: this.key,
        hoverTime: Date.now() - this.enterTime
      }
    });
    this.enterTime = 0;
    this.state = HoverState.leave;
  }
}