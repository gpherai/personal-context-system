import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";

import { buildContextMirror } from "@/ai-context/context-mirror";
import { getContextMirrorSnapshot } from "@/application/query-service";

function assertSafeOutputDir(outputDir: string): void {
  const normalized = normalize(outputDir);

  if (!normalized.includes("context-mirror")) {
    throw new Error(`Refusing to write context mirror outside a context-mirror directory: ${outputDir}`);
  }
}

export async function rebuildContextMirror(outputDir = process.env.CONTEXT_MIRROR_DIR ?? "data/context-mirror") {
  assertSafeOutputDir(outputDir);

  const snapshot = await getContextMirrorSnapshot();
  const build = buildContextMirror(snapshot);

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  for (const file of build.files) {
    const target = join(outputDir, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${file.contents.trimEnd()}\n`, "utf8");
  }

  return {
    outputDir,
    generatedAt: build.generatedAt,
    fileCount: build.files.length
  };
}
