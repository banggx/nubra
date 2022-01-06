import { Collector } from "./baseCollector";
import { BaseReporter } from "../reporter";
import { BehaviorCatcherMap } from "./behaviorCatcherMap";
import { ClickCatch, HoverCatch, ExposeCatch, ExposeRootCatch } from "./behaviorCatch";
import { ReportItemType, AjaxInfo, ReporterContext, ElementClickInfo, ElementExposeInfo, ExposeHTMLElement } from "../types";
import { getElementKey, isPaternalExposeElements } from "./utils";


export class WebBehaviorCollector extends Collector<BaseReporter> {
  cacheXMLHttpRequest: Partial<XMLHttpRequest> = {};
  private clickCatchMap = new BehaviorCatcherMap(ClickCatch);
  private hoverCatchMap = new BehaviorCatcherMap(HoverCatch);
  private exposeCatchMap = new BehaviorCatcherMap(ExposeCatch);
  private exposeRootCatchMap = new BehaviorCatcherMap(ExposeRootCatch);
  rootMutationNodeBuffer: Map<HTMLElement, 'added' | 'removed'> = new Map<HTMLElement, 'added' | 'removed'>();
  mutationProcessList: MutationRecord[] = [];
  mutationObserver = new MutationObserver(this.mutationCallback.bind(this))
  context: ReporterContext = {};
  batch: () => void;
  isStartExpose: boolean = false;  /** 是否开始曝光 */
  constructor(){
    super();
    this.batch = this.mutationBatch.bind(this);
  }
  init(reporter: BaseReporter) {
    super.init(reporter);
    this.context.reporter = reporter;
    document.body.addEventListener('click', this.globalClickEventHijack.bind(this), true);
    this.initMutation();
  }

  destroy(){
    document.body.removeEventListener('click', this.globalClickEventHijack.bind(this), true);
    this.exposeCatchMap.settle();
    super.destroy();
  }

  
  /** 全局事件委托 click事件代理 */
  public globalClickEventHijack(event: MouseEvent) {
    this.clickCatchMap.catcherMap.forEach(catcher => {
      const target = event.target as Node;
      if(catcher.el.contains(target)) {
        this.reporter?.report<ElementClickInfo>({ type: ReportItemType.elementClick, data: {
          key: getElementKey(catcher.el),
          extInfo: catcher.extInfo
        } })
      }
    })
  }

  /** initMutation */
  public initMutation() {
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  /** 使用requestAnimationFrame解决 mutation调用过于频繁问题 */
  private mutationCallback(mutations: MutationRecord[]) {
    if(!this.mutationProcessList.length) requestAnimationFrame(this.batch);
    this.mutationProcessList.push(...mutations);
  }

  /** 批处理mutation */
  private mutationBatch() {
    /** 从mutationList的最后一个mutation开始处理，因为一个node的移除和增加的最后结果决定这个node最终是否存在，比如移除和插入，最终结果是插入 */
    /** processRemovedNodes 和 processAddedNode处理之后，node的removed 还是 added 决策缓存在 rootMutationBuffer里面 */
    for(let idx = this.mutationProcessList.length - 1; idx > -1; idx--) {
      const { removedNodes, addedNodes } = this.mutationProcessList[idx];
      if(removedNodes.length) {
        this.processOperatorNodes(removedNodes, 'removed');
      }
      if(addedNodes.length) {
        this.processOperatorNodes(addedNodes, 'added');
      }
    }
    this.rootMutationNodeBuffer.clear();
    this.mutationProcessList.length = 0;
  }

  private processOperatorNodes(nodes: NodeList, operator: 'added' | 'removed') {
    const length = nodes.length;
    for(let idx = 0; idx < length; idx++) {
      const node = nodes[idx];
      if(!(node instanceof HTMLElement)) continue;
      if(this.rootMutationNodeBuffer.has(node)) continue;
      this.rootMutationNodeBuffer.set(node, operator);
    }
  }

  /** 添加点击节点到clickCatchMap */
  public click(el: HTMLElement, extInfo?: Record<string, any>) {
    this.clickCatchMap.register(el, extInfo);
  }

  /** 添加节点到hoverCatchMap */
  public hover(el: HTMLElement, extInfo?: Record<string, any>) {
    this.hoverCatchMap.register(el, extInfo, { context: { reporter: this.reporter } });
  }

  /** 从hoverCatchMap中删除监控节点 */
  public deleteHover(el: HTMLElement) {
    this.hoverCatchMap.disRegister(el);
  }

  /**
   * 注册expose监控
   * 1. 如果有指定的rootName, 则在dom上挂载该标记
   * 2. 向上逐级查找，直到找到root节点为止
   * 3. 如果返回expose相同的元素，则更新元素信息
   */
  expose(el: HTMLElement, config?: { rootName?: string, extInfo?: Record<string, any> }) {
    const extInfo = config?.extInfo;
    const rootName = config?.rootName;
    const currrentExpose = this.exposeCatchMap.register(el, extInfo, {
      originRootName: rootName,
      context: {
        reporter: this.reporter
      }
    });
    
    if(!this.isStartExpose) return;
    
    let exposeRoot: ExposeRootCatch | undefined;
    if(!rootName) {
      const exposeRootElement = currrentExpose.getCurrentExposeRootElement() ?? document.body;
      exposeRoot = this.exposeRootCatchMap.get(exposeRootElement);
    } else {
      exposeRoot = this.exposeRootCatchMap.find((root) => root.name === rootName);
    }

    if(!exposeRoot) return;

    /** 如果当前对应关系没有变化，直接返回 */
    if(currrentExpose.finalExposeRoot && currrentExpose.finalExposeRoot.el === exposeRoot.el) return;
    
    currrentExpose.setExposeRoot(exposeRoot);
    exposeRoot.observe(currrentExpose);
  }

  /**
   * 注册exposeRoot, 并创建一个Observer
   * 1. 将某个DOM挂载上exposeRoot标记
   * 2. 查询所有originRootName为空的exposeCatch元素是否为自身子元素，如果是则更新监听关系
   */
  exposeRoot(el: HTMLElement, config?: { name?: string, exposeConfig?: { rootMargin?: string; threshold?: number | number[] } }) {
    const name = config?.name;
    const exposeConfig = config?.exposeConfig;
    if(name && this.checkDuplicateName(name)) {
      throw new Error(`[Nubra Error] duplicate rootName: ${name}`);
    }
    const finalExposeConfig = Object.assign({}, { threshold: 0.2 }, exposeConfig);
    /** 判断当前节点是否有监听器，如果没有则创建一个监听器 */
    const currentExposeRoot = this.exposeRootCatchMap.register(el, undefined, 
      this.exposeRootCatchMap.has(el) ? { name } : { name, observer: new IntersectionObserver(this.exposeReport.bind(this), finalExposeConfig) }
      );
     
    if(!this.isStartExpose) return;

    /** 如果是运行时，取消所有未指定rootName的元素的被监听关系 */
    this.exposeCatchMap.catcherMap.forEach(catcher => {
      const isPaternity = isPaternalExposeElements(currentExposeRoot, catcher);
      if(!isPaternity) return;
      if(!catcher.originRootName) {
        const oldExposeRoot = catcher.finalExposeRoot as ExposeRootCatch;
        if(oldExposeRoot) oldExposeRoot.unObserver(catcher);
        currentExposeRoot.observe(catcher);
      } else if(catcher.originRootName === currentExposeRoot.name) {
        currentExposeRoot.observe(catcher);
      }
    })
  }

  /** 删除expose root */
  deleteExposeRoot(el: HTMLElement) {
    this.exposeRootCatchMap.disRegister(el);
  }

  /** 检索exposeRootMap中是否存在当前name的Catcher */
  private checkDuplicateName(name: string) {
    let result = false;
    this.exposeRootCatchMap.catcherMap.forEach(catcher => {
      if(catcher.name === name) result = true;
    })
    return result;
  }

  /** 曝光上报处理函数 */
  private exposeReport(entries: IntersectionObserverEntry[]){
    entries.forEach(entry => {
      const target = this.exposeCatchMap.get(entry.target as HTMLElement);
      if(!target) return;
      /** 非曝光 -> 曝光 */
      if(entry.isIntersecting) {
        target.handleExpose();
      } else {
        /** 曝光 -> 非曝光 */
        const settleData = target.settleExpose();
        if(settleData) {
          const { exposeId, exposeDuration } = settleData;
          this.reporter?.report<ElementExposeInfo>({ type: ReportItemType.elementExpose, data: {
            key: target.key,
            extInfo: target.extInfo,
            exposeId,
            exposeTime: exposeDuration
          } })
        }
      }
    })
  }

  /** 注册所有已建立好的exposeRoot */
  public kickAllExposeRoot(){
    this.exposeRoot(document.body, { name: 'body' });
    this.exposeCatchMap.catcherMap.forEach(catcher => {
      if(catcher.originRootName) {
        const root = this.exposeRootCatchMap.find(item => item.name === catcher.originRootName);
        if(!root) {
          console.warn('[Nnubra Wran] You designate an unexist exposeRoot, Please check your code!');
          return;
        }
        root.observe(catcher);
      } else {
        const rootElement = catcher.getCurrentExposeRootElement();
        if(!rootElement) {
          console.warn(`[Nubra Wran] can not find target's root of exposure! ${catcher.key}`);
          return;
        }
        const root = this.exposeRootCatchMap.find(item => item.name === rootElement.dataset.name);
        if(!root) {
          console.warn(`[Nnubra Wran] You designate an unexist exposeRoot! ${catcher.key}`);
          return;
        }
        root.observe(catcher)
      }
    })
    this.isStartExpose = true;
  }
  
  /** 取消节点的曝光 */
  public cancelExposureByElement(el: ExposeHTMLElement) {
    const catcher = this.exposeCatchMap.get(el);
    if(!catcher) {
      console.warn('[Nubra Warn] you attempt to delete an unexist expose target');
      return;
    }
    if(!this.isStartExpose) {
      this.exposeCatchMap.disRegister(el);
      return;
    }
    if(catcher.finalExposeRoot) {
      catcher.finalExposeRoot.unObserver(catcher);
    }
    return
  }
}