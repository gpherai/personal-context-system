import { captureEntry } from "../src/application/context-service";
import { getPrismaClient } from "../src/infrastructure/database/client";
import { createPrismaContextRepository } from "../src/infrastructure/database/prisma-context-repository";

const prisma = getPrismaClient();
const repository = createPrismaContextRepository();

const existing = await prisma.entry.findFirst({
  where: {
    title: "Personal Context System build direction"
  }
});

if (!existing) {
  const formData = new FormData();
  formData.set("type", "decision");
  formData.set("status", "active");
  formData.set("privacyLevel", "private");
  formData.set("title", "Personal Context System build direction");
  formData.set(
    "body",
    "PostgreSQL is canonical, generated context mirror files are projections, and UI writes go through application services."
  );
  formData.set("summary", "Initial architectural direction for the local-first context system.");
  formData.set("themes", "architecture, AI context");
  formData.set("projects", "personal-context-system");

  await captureEntry(formData, repository);
}

await prisma.$disconnect();
