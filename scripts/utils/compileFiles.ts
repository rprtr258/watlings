import fs from "fs/promises";
import {fileURLToPath} from "url";
import {getWastParser} from "./getWastParser.ts";

/**
 * Get list of files that have been updated since last run
 * Uses file modification times instead of SHA-1 hashes for better performance
 */
async function getChangedFiles(files: string[]): Promise<string[]> {
  const cachePath = fileURLToPath(new URL("../../.cache/cache.txt", import.meta.url));

  try {
    await fs.access(".cache");
  } catch {
    await fs.mkdir(".cache");
  }

  // Read cache: stores filename -> mtimeMs
  let cache = new Map<string, number>();
  try {
    const bytes = await fs.readFile(cachePath, 'utf-8');
    cache = new Map(
      bytes
        .split('\n')
        .filter(line => line.trim())
        .map((line): [string, number] => {
          const [name, mtimeStr] = line.split(':');
          return [name, parseFloat(mtimeStr)];
        })
    );
  } catch {}

  const changedFiles: string[] = [];

  for (const name of files) {
    const path = fileURLToPath(new URL(`../../exercises/${name}`, import.meta.url));

    try {
      const stats = await fs.stat(path);
      const cachedMtime = cache.get(name);

      // File is changed if no cache entry or mtime is newer
      if (!cachedMtime || stats.mtimeMs > cachedMtime) {
        changedFiles.push(name);
      }
    } catch (error) {
      // File doesn't exist or can't be read - treat as changed
      changedFiles.push(name);
    }
  }

  return changedFiles;
}

async function getFileNames(fileNameFilter?: string): Promise<string[]> {
  const fileNames = await fs.readdir("exercises");
  const changedFiles = await getChangedFiles(fileNames);

  const regex = new RegExp(fileNameFilter ?? "", "i");

  return changedFiles.filter((fileName) => {
    if (fileNameFilter && !regex.test(fileName)) return false;
    return fileName.endsWith(".wat");
  });
}

export async function compileFiles(fileNameFilter: string | undefined = process.argv[2]): Promise<void> {
  const fileNames = await getFileNames(fileNameFilter);

  if (!fileNames.length) {
    console.log("no changes detected.");
    return;
  }

  const parseWast = await getWastParser();

  const cachePath = fileURLToPath(new URL("../../.cache/cache.txt", import.meta.url));
  const cacheFileHandle = await fs.open(cachePath, "a");

  let successCount = 0;
  await Promise.all(fileNames.map(async (file) => {
    try {
      const jsFilePath = fileURLToPath(
        new URL(
          "../../exercises/" + file.replace(/\.[^.]+$/, ".ts"),
          import.meta.url
        )
      );
      await fs.access(jsFilePath);

      console.log(`Running associated JS file for ${file}`);
      await import(jsFilePath);
      console.log("_".repeat(32) + "\n");
      return;
    } catch {}

    const filePath = fileURLToPath(
      new URL("../../exercises/" + file, import.meta.url)
    );

    try {
      await parseWast(filePath);

      // Store file modification time in cache
      const stats = await fs.stat(filePath);
      cacheFileHandle.write(`${file}:${stats.mtimeMs}\n`);
      successCount++;
    } catch (e) {
      console.error(`Error at ${filePath}:`, e);
      process.exit(1);
    }
  }));

  await cacheFileHandle.close();

  console.log(`compiled ${successCount} file${successCount === 1 ? "" : "s"}`);
}
