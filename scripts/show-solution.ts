import {readFile} from "fs/promises";
import {basename} from "path";
import {fileURLToPath} from "url";
import {parsePatch} from "./utils/patch.ts";
import {findFile} from "./utils/findFile.ts";
import {colors} from "./utils/colors.ts";

const stub = process.argv[2] ?? "001_hello";
const sourceFileNameWithExt = await findFile(stub, "patch");
if (!sourceFileNameWithExt) {
  console.log(`No file matching ${stub} found in the exercises folder.`);
  process.exit(1);
}

const nameBase = basename(sourceFileNameWithExt, ".patch");

const patchFilePath = fileURLToPath(new URL(`../patch/${nameBase}.patch`, import.meta.url));
const patchFile = await readFile(patchFilePath, "utf-8").catch(() => {
  console.error(`No patch file found under patch/${nameBase}.patch`);
  process.exit(1);
});

try {
  const lines = parsePatch(patchFile)
    .map(
      ({ addLines, start }) =>
        `${colors.faded("on line")} ${start}:\n${colors.green(
          addLines.join("\n")
        )}`
    )
    .join("\n\n");

  console.log(
    `Try adding this to file ${colors.bold(nameBase)}.wat:\n\n${lines}`
  );
} catch (e) {
  console.error(`Error fetching solution: ${e.message}`);
}
