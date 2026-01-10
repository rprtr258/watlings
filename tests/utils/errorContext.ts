// This incredibly strange fix for async function context was contributed
// by laquasicinque. I would have never been able to figure this out.

const contextMap = new Map();

let govno = "";
export function getContext() {
  try {
    throw new Error();
  } catch (e) {
    const key = e.stack.match(/🫨🫨.+?🫨🫨/)?.[0] ?? govno;
    return contextMap.get(key);
  }
}

export async function createContext(value: any, func: () => Promise<any>) {
  govno = "🫨🫨" + Math.random().toString(16) + "🫨🫨";
  const key = govno;
  contextMap.set(key, value);

  const fn = {
    async [key]() {
      return await func();
    },
  }[key];
  await fn();
  contextMap.delete(key);
}
