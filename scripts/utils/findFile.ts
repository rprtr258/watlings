import {readdir} from "fs/promises";
import {basename, extname} from "path";
import {fileURLToPath} from "url";

export async function findFile(stub: string, dir: "exercises" | "patch" | "tests"): Promise<string | undefined> {
  const folderFiles = await readdir(fileURLToPath(new URL(`../../${dir}`, import.meta.url)));
  const targetFileName = basename(stub, extname(stub));
  return folderFiles.find(fileName => {
    if (dir === "exercises" && !fileName.endsWith(".wat")) return false;
    if (dir === "patch" && !fileName.endsWith(".patch")) return false;
    if (dir === "tests" && !fileName.endsWith(".test.ts")) return false;
    return fileName.includes(targetFileName);
  });
}
