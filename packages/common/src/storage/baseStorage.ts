/** Storage 自定义缓存基类 */
/** 允许读写数据为一步方法，主要帮助支持innoDB等多种方法的存储 */
export abstract class Storage {
  abstract setItem(key: string, value: any): Promise<void>;
  
  abstract getItem<T = any>(key: string, defaultValue?: T): Promise<T>;

  abstract removeItem(key: string): Promise<void>;

  abstract iterator<T = any>(ite: (key: string, value: T) => Promise<any>): Promise<any[]>;
}