"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

export async function deleteThemeAction(themeId: string): Promise<void> {
  try {
    await createPrismaContextRepository().deleteTheme(themeId);
  } catch (error) {
    if (isDatabaseUnavailable(error)) return;
    throw error;
  }

  revalidatePath("/cabinet");
  revalidatePath("/map");
  redirect("/cabinet");
}
