import { ExposeHTMLElement } from "../../types";
import { ExposeCatch, ExposeRootCatch } from '../behaviorCatch';

/** 格式化堆栈信息 */
export function parseStackToLine(stack: any) {
  return stack.split("\n").slice(1).map(item => item.replace(/^\s+at\s+/g, "")).join("^");
}

/** 获取HTML节点key */
export function getElementKey(el: HTMLElement): string {
  if(!el) return '';
  const attrKey = el.getAttribute('nubra-key');
  if(attrKey) return attrKey;
  const dataValue = el.dataset.nubraKey;
  if(dataValue) return dataValue;
  return '';
}

export function isPaternalExposeElements(exposeRoot: ExposeRootCatch, exposeTarget: ExposeCatch) {
  const helper = (exposeRoot: ExposeRootCatch, exposeTarget: { el: ExposeHTMLElement }) => {
    if(exposeRoot.el === document.body) return true;
    const parent = exposeRoot.el.parentElement as ExposeHTMLElement;
    if(!parent) return false;
    if(parent.dataset.isExposeRoot && parent === exposeRoot.el) return true;
    return helper(exposeRoot, { el: parent });
  }
  return helper(exposeRoot, exposeTarget);
}