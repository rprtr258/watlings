import {readdir, readFile} from "fs/promises";
import path, {basename} from "path";
import {fileURLToPath} from "url";
import {patch as applyPatch} from "../../scripts/utils/patch.ts";
import {test, assert, throws, setSuccess} from "../utils/test-runner.ts";

setSuccess("Patches are all working correctly.")

async function getFilesInFolder(relativePath: string) {
  const folderPath = fileURLToPath(new URL(relativePath, import.meta.url));
  const folderFiles = await readdir(folderPath);

  const fileReads = folderFiles
    .map((name) => [name, path.resolve(folderPath, name)])
    .map(async ([name, path]) => ({
      name,
      content: await readFile(path, "utf-8"),
    }));

  return Promise.all(fileReads);
};

async function getPatchMap(): Promise<Map<string, { exercise: string; patch?: string; }>> {
  const [exercises, patches] = await Promise.all([
    getFilesInFolder("../../exercises"),
    getFilesInFolder("../../patch"),
  ]);

  const map = new Map();
  for (const { name, content } of exercises) {
    if (!name.endsWith(".wat")) continue;

    map.set(basename(name, ".wat"), { exercise: content });
  }

  for (const { name, content } of patches) {
    if (!name.endsWith(".patch")) continue;

    const baseName = basename(name, ".patch");
    if (!map.has(baseName)) {
      console.log(map);
      throw new Error(`No exercise file found for patch ${name}`);
    }
    map.get(baseName).patch = content;
  }

  return map;
};

test("each file has an associated patch", async () => {
  const patchMap = await getPatchMap();

  for (const [name, { patch }] of patchMap) {
    assert(patch !== undefined, `patch does not exists for ${name}`);
  }
});

test("can apply patch", async () => {
  const patchMap = await getPatchMap();
  for (const [name, { patch, exercise }] of patchMap) {
    assert(!throws(() => applyPatch(patch, exercise)), `could not patch ${name}`);
  }
});
