import {instantiate} from "./utils/instantiate.ts";
import {assert, matchObjectShape, setSuccess, test} from "./utils/test-runner.ts";
import {getWasm} from "./utils/getWasm.ts";

const wasmBytes = await getWasm(import.meta.url);

setSuccess("Congrats! Continue onto 010_memory.wat");

test("exports logData, mem", async () => {
  const exports = await instantiate(wasmBytes, {
    env: {log_string: () => {}},
  });

  assert(
    matchObjectShape(exports, {
      logData: Function,
      mem: WebAssembly.Memory,
    }),
    "does not export all of: logData and mem"
  );
});

test("logData logs 3 strings", async () => {
  const loggedStrings: string[] = [];
  const exports = await instantiate(wasmBytes, {
    env: {
      log_string: (start: number, length: number) => {
        const dataView = new Uint8Array(mem.buffer);
        const byteSlice = dataView.slice(start, start + length);
        loggedStrings.push(new TextDecoder().decode(byteSlice));
      },
    },
  });

  const { mem, logData } = exports;
  logData();
  assert(loggedStrings.length >= 3, "logData did not log 3 strings");
});

test("logData logs 3 different string(s)", async () => {
  const loggedStrings: string[] = [];
  const { mem, logData } = await instantiate(wasmBytes, {
    env: {
      log_string: (start: number, length: number) => {
        const dataView = new Uint8Array(mem.buffer);
        const byteSlice = dataView.slice(start, start + length);
        loggedStrings.push(new TextDecoder().decode(byteSlice));
      },
    },
  });

  logData();

  assert(
    new Set(loggedStrings).size >= 3,
    "logData logged the same string 3 times"
  );
});
