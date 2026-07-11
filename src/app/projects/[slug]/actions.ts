"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateProjectFromForm, type MutationState } from "@/application/context-service";
import { databaseMutationErrorState, isDatabaseUnavailable } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";

export async function deleteProjectAction(
  projectId: string,
  _previousState: MutationState,
  _formData: FormData
): Promise<MutationState> {
  if (!isValidId(projectId)) {
    return { status: "error", message: "Invalid project id." };
  }

  try {
    await createPrismaContextRepository().deleteProject(projectId);
  } catch (error) {
    if (isDatabaseUnavailable(error)) return databaseMutationErrorState();
    return { status: "error", message: error instanceof Error ? error.message : "Could not delete project." };
  }

  revalidatePath("/cabinet");
  revalidatePath("/map");
  redirect("/cabinet");
}

export async function updateProjectAction(
  projectId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(projectId)) {
    return { status: "error", message: "Invalid project id." };
  }

  const result = await updateProjectFromForm(projectId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/projects/${result.project.slug}`);
  revalidatePath("/cabinet");
  revalidatePath("/map");
  return { status: "success", message: "Project updated." };
}
