import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<any[]>();

export function getContext(): any[] | undefined {
  return asyncLocalStorage.getStore();
}

export async function createContext(value: any[], func: () => Promise<any>) {
  return asyncLocalStorage.run(value, func);
}
