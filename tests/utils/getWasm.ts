import {fileURLToPath} from "url";
import fs from "fs/promises";
import {compileFiles} from "../../scripts/utils/compileFiles.ts";

function getBaseName(path: string) {
  const baseName = path.split("/").pop().split(".")[0];
  return baseName;
};

export async function getWasm(path: string) {
  const baseName = getBaseName(path);
  await compileFiles(baseName);

  const filePath = fileURLToPath(new URL(`../../.cache/${baseName}.wasm`, import.meta.url));
  return await fs.readFile(filePath);
}
