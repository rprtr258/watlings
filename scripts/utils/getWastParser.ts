import {spawn} from "child_process";
import {fileURLToPath} from "url";
import {basename} from "path";

function spawnPromise(command: string, args: readonly string[]): Promise<void> {
  const s = spawn(command, args, { stdio: "inherit" });
  return new Promise((res, rej) => {
    s.on("close", (err) => {
      if (err !== 1) {
        res();
      } else {
        rej(err);
      }
    });
    s.on("error", (err) => {
      rej(err);
    });
  });
};

export async function getWastParser(): Promise<(filePath: string) => Promise<void>> {
  try {
    // Check for wasm-tools CLI availability
    await spawnPromise("wasm-tools", ["--version"]);

    return async filePath => {
      const fileName = basename(filePath, ".wat");
      const wasmPath = fileURLToPath(new URL(`../../.cache/${fileName}.wasm`, import.meta.url));

      // Use wasm-tools CLI to parse WAT into a WASM binary
      await spawnPromise("wasm-tools", ["parse", filePath, "-o", wasmPath]);
    };
  } catch {
    console.error(
      "wasm-tools CLI not found. Please install it from: https://github.com/bytecodealliance/wasm-tools"
    );
    process.exit(1);
  }
}
