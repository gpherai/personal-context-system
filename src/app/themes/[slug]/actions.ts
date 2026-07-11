"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { mergeThemesFromForm, updateThemeFromForm, type MutationState } from "@/application/context-service";
import { databaseMutationErrorState, isDatabaseUnavailable } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";

export async function deleteThemeAction(
  themeId: string,
  _previousState: MutationState,
  _formData: FormData
): Promise<MutationState> {
  if (!isValidId(themeId)) {
    return { status: "error", message: "Invalid theme id." };
  }

  try {
    await createPrismaContextRepository().deleteTheme(themeId);
  } catch (error) {
    if (isDatabaseUnavailable(error)) return databaseMutationErrorState();
    return { status: "error", message: error instanceof Error ? error.message : "Could not delete theme." };
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
    return { status: "error", message: "Invalid theme id." };
  }

  const result = await updateThemeFromForm(themeId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/themes/${result.theme.slug}`);
  revalidatePath("/cabinet");
  revalidatePath("/map");
  return { status: "success", message: "Theme updated." };
}

export async function mergeThemeAction(
  themeId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(themeId)) {
    return { status: "error", message: "Invalid theme id." };
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
