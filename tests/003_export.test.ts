import {assert, matchObjectShape, setSuccess, test} from "./utils/test-runner.ts";
import {instantiate} from "./utils/instantiate.ts";
import {getWasm} from "./utils/getWasm.ts";

const wasmBytes = await getWasm(import.meta.url);

setSuccess("Congrats! Continue onto 004_function.wat");

test("exports a main function", async () => {
  const log = () => {};

  const exports = await instantiate(wasmBytes, {env: {log}});

  assert(
    matchObjectShape(exports, { main: Function }),
    "does not export a main function"
  );
});

test("doesn't call log until manually invoked", async () => {
  let called = false;
  const log = () => (called = true);

  const exports = await instantiate(wasmBytes, {env: {log}});

  assert(called == false, "log was called before main was invoked");

  exports.main();

  assert(called, "log was not called");
});

test("main function still logs 42", async () => {
  let output: number;
  const log = (num: number) => (output = num);

  const exports = await instantiate(wasmBytes, {env: {log}});

  exports.main();

  assert(output === 42, "output is not 42");
});
