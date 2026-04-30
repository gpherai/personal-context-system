import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
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

async function listFilesRecursive(root: string, current = ""): Promise<string[]> {
  const directory = join(root, current);
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = current ? `${current}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(root, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

export async function getContextMirrorStatus(outputDir = process.env.CONTEXT_MIRROR_DIR ?? "data/context-mirror") {
  assertSafeOutputDir(outputDir);

  try {
    const manifestPath = join(outputDir, "manifest.json");
    const [manifestStats, manifestText, files] = await Promise.all([
      stat(manifestPath),
      readFile(manifestPath, "utf8"),
      listFilesRecursive(outputDir)
    ]);
    const manifest = JSON.parse(manifestText) as {
      generatedAt?: string;
      counts?: Record<string, number>;
      files?: string[];
    };

    return {
      exists: true as const,
      outputDir,
      generatedAt: manifest.generatedAt,
      manifestUpdatedAt: manifestStats.mtime,
      counts: manifest.counts ?? {},
      files
    };
  } catch {
    return {
      exists: false as const,
      outputDir,
      files: [] as string[]
    };
  }
}
