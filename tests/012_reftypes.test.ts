import {instantiate} from "./utils/instantiate.ts";
import {assert, matchObjectShape, setSuccess, test} from "./utils/test-runner.ts";
import {getWasm} from "./utils/getWasm.ts";

const wasmBytes = await getWasm(import.meta.url);

setSuccess("Congrats! Continue onto 013_table.wat");

test("exports main", async () => {
  const exports = await instantiate(wasmBytes, {
    env: {
      globalExternRef: new WebAssembly.Global(
        { value: "externref" },
        { value: 42 }
      ),
      sendFuncRef: () => {},
      sendExternRef: () => {},
    },
  });

  assert(
    matchObjectShape(exports, {
      main: Function,
    }),
    "does not export a main function"
  );
});

test("calls sendExternRef with an extern ref", async () => {
  let output: any;
  const exports = await instantiate(wasmBytes, {
    env: {
      globalExternRef: new WebAssembly.Global(
        { value: "externref" },
        { value: 42 }
      ),
      sendExternRef: (value: any) => {output = value;},
      sendFuncRef: () => {},
    },
  });

  const { main } = exports;
  main();

  assert(output !== undefined, "output is undefined");
});

test("calls sendFuncRef with a func ref", async () => {
  let output: any;
  const exports = await instantiate(wasmBytes, {
    env: {
      globalExternRef: new WebAssembly.Global(
        { value: "externref" },
        { value: 42 }
      ),
      sendFuncRef: (value: any): void => {output = value;},
      sendExternRef: () => {},
    },
  });

  const { main } = exports;
  main();

  assert(output !== undefined, "output is undefined");
  assert(
    output instanceof Function || (output === null) === true,
    "output is not a function or null"
  );
});
