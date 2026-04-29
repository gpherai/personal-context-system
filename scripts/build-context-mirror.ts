import "dotenv/config";

import { rebuildContextMirror } from "../src/infrastructure/files/context-mirror-writer";
import { getPrismaClient } from "../src/infrastructure/database/client";

try {
  const result = await rebuildContextMirror();

  console.log(
    `Context mirror generated at ${result.generatedAt}: ${result.fileCount} files in ${result.outputDir}`
  );
} finally {
  try {
    await getPrismaClient().$disconnect();
  } catch {
    // The command may fail before the Prisma client is initialized.
  }
}
