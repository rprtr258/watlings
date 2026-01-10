import {patchFile} from "./utils/patchFile.ts";
patchFile(process.argv[2] ?? "001_hello");
