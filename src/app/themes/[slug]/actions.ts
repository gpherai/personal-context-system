"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { mergeThemesFromForm, updateThemeFromForm, type MutationState } from "@/application/context-service";
import { isDatabaseUnavailable } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";

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

export async function updateThemeAction(
  themeId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(themeId)) {
    return { status: "error", message: "Ongeldig thema-id." };
  }

  const result = await updateThemeFromForm(themeId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/themes/${result.theme.slug}`);
  revalidatePath("/cabinet");
  revalidatePath("/map");
  return { status: "success", message: "Thema bijgewerkt." };
}

export async function mergeThemeAction(
  themeId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(themeId)) {
    return { status: "error", message: "Ongeldig thema-id." };
  }

  const result = await mergeThemesFromForm(themeId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/cabinet");
  revalidatePath("/map");
  revalidatePath(`/themes/${result.theme.slug}`);
  redirect(`/themes/${result.theme.slug}`);
}
