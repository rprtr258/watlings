import {colors} from "../../scripts/utils/colors.ts";
import {createContext, getContext} from "./errorContext.ts";

type ObjectShape = {
  [key: string]:
    | FunctionConstructor
    | ObjectConstructor
    | NumberConstructor
    | StringConstructor
    | BooleanConstructor
    | { new (descriptor: any): WebAssembly.Memory; prototype: WebAssembly.Memory; }
    | ObjectShape;
};

let successMessage = "Congrats! Move onto the next lesson.";
let failMessage = "Some tests failed!";

export const setSuccess = (message: string) => (successMessage = message);
export const setFailure = (message: string) => (failMessage = message);

const testResults: {name: string, errors: string[]}[] = [];
let lastTestResultId: string | number | NodeJS.Timeout;
const scheduleTestResult = () => {
  clearTimeout(lastTestResultId);

  lastTestResultId = setTimeout(() => {
    for (const { name, errors } of testResults) {
      const marker = errors.length ? colors.red("✘") : colors.green("✓");
      console.log(`${marker} ${name}`);
      if (errors.length) {
        console.log(errors.map(e => `  · ${colors.red(e)}`).join("\n"));
      }
    }

    console.log("----------------");

    const isSuccess = testResults.every(({ errors }) => errors.length === 0);
    if (successMessage && isSuccess) {
      console.log(successMessage);
    } else if (failMessage && !isSuccess) {
      console.log(failMessage);
      process.exitCode = 1;
    }
    testResults.length = 0;
  }, 0);
};

export async function test(name: string, fn: () => Promise<void> | void) {
  const testResult = {name, errors: [] as any[]};
  testResults.push(testResult);

  createContext(testResult.errors, async () => {
    try {
      await fn();
    } catch (e) {
      testResult.errors = [e.message];
    } finally {
      scheduleTestResult();
    }
  });
}

export function assert(boolExpression: boolean, errorMessage: string) {
  if (!boolExpression) {
    getContext().push(errorMessage);
  }
}

// Boolean functions below

export function arrayEquals<T>(a: T[], b: T[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** @param {any} a @param {import('./types.d.ts').ObjectShape} b */
export function matchObjectShape(a: any, b: ObjectShape) {
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.toString() !== bKeys.toString()) {
    return false;
  }

  for (const key of aKeys) {
    if (a[key] === undefined || b[key] === undefined) {
      return false;
    }

    if (b[key] === Function && typeof a[key] === "function") {
      continue;
    }
    if (b[key] === Object && typeof a[key] === "object") {
      continue;
    }
    if (b[key] === Number && typeof a[key] === "number") {
      continue;
    }
    if (b[key] === String && typeof a[key] === "string") {
      continue;
    }
    if (b[key] === Boolean && typeof a[key] === "boolean") {
      continue;
    }
    if (b[key] === WebAssembly.Memory && a[key] instanceof WebAssembly.Memory) {
      continue;
    }
    // @ts-ignore
    if (typeof a[key] === "object" && matchObjectShape(a[key], b[key])) {
      continue;
    }

    return false;
  }

  return true;
}

export function throws(fn: () => any) {
  try {
    fn();
    return false;
  } catch (e) {
    return true;
  }
}
