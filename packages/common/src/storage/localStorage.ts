import { Storage } from "./baseStorage";

export class LocalStorage extends Storage{
  async setItem(key: string, value: any) {
    if(!localStorage) return;
    if(value === undefined || value === null) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  async getItem(key: string, defaultValue?: any) {
    if(!localStorage) return defaultValue;
    const value = localStorage.getItem(key);
    if(value == undefined || value === null) return defaultValue;
    try {
      return JSON.parse(value)
    } catch {
      return value;
    }
  }

  async removeItem(key: string) {
    localStorage?.removeItem(key);
  }

  async iterator<T>(ite: (key: string, value: T) => Promise<any>) {
    return await Promise.all(Object.keys(localStorage).map(async (key: string) => {
      const curValue: T = await this.getItem(key);
      return await ite(key, curValue);
    }));
  }
}