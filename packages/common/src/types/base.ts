export enum ReportItemType {
  staticError = 'static-error',           /** 静态资源错误 */
  runtimeError = 'runtime-error',         /** 运行时错误 */
  asyncError = 'async-error',             /** 异步错误 */
  ajax = 'ajax',                          /** ajax接口请求信息捕获 */
  custom = 'custom',                      /** 自定义上报类型 */
  pegeEnter = 'page-enter',               /** 页面加载进入 */
  pageLeave = 'page-leave',               /** 页面退出 */
  elementExpose = 'element-expose',       /** 页面节点曝光 */
  elementClick = 'element-click',         /** 页面节点点击 */
  elementHover = 'element-hover',         /** 页面节点悬浮 */
}

export interface HostContext {
  device?: string;                        /** 设备类型 */
  deviceBrand?: string;                   /** 设备品牌 */
  deviceModel?: string;                   /** 设备型号 */
  osName?: string;                        /** 系统名称 */
  osVersion?: string;                     /** 系统版本 */
  browser?: string;                       /** 浏览器类型 */
  lang?: string;                          /** 语言参数 */
  location?: string;                      /** 位置坐标 */
  network?: {
    downlink?: string;                    /** 网络下行速度 */
    effectiveType?: string;               /** 网络类型 */
    rtt?: number;                         /** 估算往返时间 */
    type?: string;                        /** 网络连接信息 */
  };                                      /** 网络信息 */
  screenHeight?: number;                  /** 屏幕高度 */
  screenWidth?: number;                   /** 屏幕宽度 */
  clientHeight?: number;                  /** client高度 */
  clientWidth?: number;                   /** client宽度 */
  devicePixeRatio?: number;               /** 设备像素点信息 */    
}

export interface PageContext {
  pageName: string;                       /** 页面名称 */
  referPageName?: string;                 /** 上级页面名 */
  accessId: string;                       /** 一次访问标示 */
  referAccessId?: string;                 /** 上一次访问的标示 */
  referElementId?: string;                /** 导致页面跳转的elementId */
  referrer?: string;                      /** 当前页面来源 */
  step: number;                           /** 页面步数 */
  extInfo?: Record<string, any>;          /** 附加信息 */
}

export interface BaseReportItem<T = Record<string, any>> {
  type: ReportItemType;                   /** 上报数据类型 */
  data: T;                                /** 上报的实际数据信息 */
}

export type ReportItem<Type extends BaseReportItem> = Type & {
  ctime: number;                          /** 数据产生时间戳 */
  context: {
    page: PageContext;
    host: HostContext;
  }
}

export interface LinkedData {
  contextId: string;
  entranceId: string;                     /** 入口ID */
  referAcceccId: string;                  /** 源ID */
  referElementId: string;                 /** 源节点 */
  referrer?: string;                      /** 来源页面 */
}
