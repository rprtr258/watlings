import fs from "fs/promises";
import {webcrypto} from "crypto";
import {fileURLToPath} from "url";
import {getWastParser} from "./getWastParser.ts";

/**
 * Get SHA-1 hash of file - used for detecting updates
 */
async function getSha1Hash(buffer: Buffer<ArrayBuffer>): Promise<string> {
  const byteHash = await webcrypto.subtle.digest("SHA-1", buffer);
  return Array.from(new Uint8Array(byteHash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * Get list of files that have since been updated since last run
 * Also return files that do not have a corresponding build
 */
async function getChangedFiles(files: string[]): Promise<string[]> {
  const cachePath = fileURLToPath(new URL("../../.cache/cache.txt", import.meta.url));

  try {
    await fs.access(".cache");
  } catch {
    await fs.mkdir(".cache");
  }

  let contents = new Map<string, string>();
  try {
    const bytes = await fs.readFile(cachePath);
    const fileText = new TextDecoder("utf-8").decode(bytes);
    contents = new Map(
      fileText
        .split("\n")
        .map((line): [string, string] => line.split(":") as [string, string])
    );
  } catch {}

  const filePromises = files.map(async (name) => {
    const path = fileURLToPath(new URL(`../../exercises/${name}`, import.meta.url));
    const bytes = await fs.readFile(path);
    return [name, await getSha1Hash(bytes)];
  });

  const fileHashes = await Promise.all(filePromises);

  return fileHashes
    .filter(([name, hash]) => contents.get(name) !== hash)
    .map(([name]) => name);
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

      // add WAT hash
      const fileBytes = await fs.readFile(filePath);
      const hash = await getSha1Hash(fileBytes);
      cacheFileHandle.write(`${file}:${hash}\n`);
      successCount++;
    } catch (e) {
      console.error(`Error at ${filePath}:`, e);
      process.exit(1);
    }
  }));

  await cacheFileHandle.close();

  console.log(`compiled ${successCount} file${successCount === 1 ? "" : "s"}`);
}
