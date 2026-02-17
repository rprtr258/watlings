import {colors} from "../../scripts/utils/colors.ts";

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

const testResults: { name: string; errors: string[]; }[] = [];
let reportScheduled = false;

function scheduleReport() {
  if (reportScheduled) return;
  reportScheduled = true;

  // Use setImmediate instead of setTimeout(0) for slightly better timing
  setImmediate(() => {
    for (const { name, errors } of testResults) {
      const marker = errors.length ? colors.red("✘") : colors.green("✓");
      console.log(`${marker} ${name}`);
      if (errors.length) {
        console.log(errors.map((e: string) => `  · ${colors.red(e)}`).join("\n"));
      }
    }

    console.log("----------------");

    const allPassed = testResults.every(({ errors }) => errors.length === 0);
    if (allPassed && successMessage) {
      console.log(successMessage);
    } else if (!allPassed && failMessage) {
      console.log(failMessage);
      process.exitCode = 1;
    }

    // Reset for next run
    testResults.length = 0;
    reportScheduled = false;
  });
}

export async function test(name: string, fn: () => Promise<void> | void) {
  const errors: string[] = [];

  try {
    await fn();
  } catch (e) {
    if (e instanceof Error && e.message) {
      errors.push(e.message);
    }
  }

  testResults.push({ name, errors });
  scheduleReport();
}

export function assert(boolExpression: boolean, errorMessage: string) {
  if (!boolExpression) {
    throw new Error(errorMessage);
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
