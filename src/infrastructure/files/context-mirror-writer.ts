import "server-only";

import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, normalize, resolve, sep } from "node:path";

import { buildContextMirror } from "@/ai-context/context-mirror";
import { getContextMirrorSnapshot } from "@/application/query-service";

function assertSafeOutputDir(outputDir: string): void {
  const resolved = resolve(outputDir);
  const segment = `${sep}context-mirror`;

  if (!resolved.includes(segment) && !resolved.endsWith("context-mirror")) {
    throw new Error(`Refusing to write context mirror outside a context-mirror directory: ${outputDir}`);
  }
}

function assertSafeFilePath(outputDir: string, filePath: string): void {
  const resolvedDir = resolve(outputDir);
  const resolvedFile = resolve(outputDir, filePath);

  if (!resolvedFile.startsWith(resolvedDir + sep) && resolvedFile !== resolvedDir) {
    throw new Error(`File path escapes output directory: ${filePath}`);
  }
}

export async function rebuildContextMirror(outputDir = process.env.CONTEXT_MIRROR_DIR ?? "data/context-mirror") {
  assertSafeOutputDir(outputDir);

  const snapshot = await getContextMirrorSnapshot();
  const build = buildContextMirror(snapshot);

  const tmpDir = `${outputDir}.tmp`;
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });

  for (const file of build.files) {
    assertSafeFilePath(tmpDir, file.path);
    const target = join(tmpDir, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${file.contents.trimEnd()}\n`, "utf8");
  }

  await rm(outputDir, { recursive: true, force: true });
  await rename(tmpDir, outputDir);

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

  const manifestPath = join(outputDir, "manifest.json");

  let manifestStats: Awaited<ReturnType<typeof stat>>;
  let manifestText: string;
  try {
    [manifestStats, manifestText] = await Promise.all([
      stat(manifestPath),
      readFile(manifestPath, "utf8")
    ]);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { exists: false as const, outputDir, files: [] as string[] };
    }
    throw err;
  }

  const manifest = JSON.parse(manifestText) as {
    generatedAt?: string;
    counts?: Record<string, number>;
    files?: string[];
  };
  const files = await listFilesRecursive(outputDir);

  return {
    exists: true as const,
    outputDir,
    generatedAt: manifest.generatedAt,
    manifestUpdatedAt: manifestStats.mtime,
    counts: manifest.counts ?? {},
    files
  };
}
