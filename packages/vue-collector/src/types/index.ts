export interface PageLeaveInfo {
  stayTime: number;
  pageName: string;
}

export interface PageEnterInfo {
  pageName?: string;
  enterTime: number;
}

export interface VueErrorInfo {
  stack: string;
  messgae: string;
}