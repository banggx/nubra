import { BaseReporter } from "../reporter";

export abstract class Collector<Reportor extends BaseReporter> {
  protected reporter?: Reportor = undefined;

  /** 初始化 reporter */
  init(reporter: Reportor) {
    this.reporter = reporter;
  }

  /** 写在 reporter */
  destroy(){
    this.reporter = undefined;
  }
}