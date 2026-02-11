import {fileURLToPath} from "url";
import {readdir} from "fs/promises";
import path from "path";
import {test} from "../utils/test-runner.ts";

function wait(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("can run all tests", async () => {
  const folderPath = fileURLToPath(new URL("../", import.meta.url));
  const folderFiles = await readdir(folderPath);

  const testFiles = folderFiles
    .filter((fileName) => fileName.endsWith(".test.ts"))
    .map((fileName) => ({
      path: path.join(folderPath, fileName),
      name: fileName,
    }));

  for (const { path, name } of testFiles) {
    console.log(`running "${name}":`);
    await import(path);
    await wait(100);
  }
});
