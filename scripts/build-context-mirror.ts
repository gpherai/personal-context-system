import "dotenv/config";

import { rebuildMirror } from "../src/application/context-service";
import { getPrismaClient } from "../src/infrastructure/database/client";

try {
  const result = await rebuildMirror();

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
