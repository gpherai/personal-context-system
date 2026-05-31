"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  captureSource,
  deleteSource,
  extractPickerSourceIds,
  makeSourceErrorState,
  parseCreateSourceFormData,
  parseUpdateSourceFormData,
  updateSource,
  type MutationState
} from "@/application/context-service";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";

export async function createSourceAction(
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  const parsed = parseCreateSourceFormData(formData);
  if (!parsed.success) return makeSourceErrorState(parsed.error);

  const result = await captureSource(parsed.data, extractPickerSourceIds(formData), createPrismaContextRepository());
  if (!result.ok) return result.state;

  revalidatePath("/sources");
  revalidatePath("/cabinet");
  redirect(`/sources/${result.source.id}`);
}

export async function updateSourceAction(
  id: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(id)) {
    return { status: "error", message: "Invalid source id." };
  }

  const parsed = parseUpdateSourceFormData(id, formData);
  if (!parsed.success) return makeSourceErrorState(parsed.error);

  const result = await updateSource(parsed.data, extractPickerSourceIds(formData), createPrismaContextRepository());
  if (!result.ok) return result.state;

  revalidatePath("/sources");
  revalidatePath(`/sources/${id}`);
  revalidatePath("/cabinet");
  redirect(`/sources/${id}`);
}

export async function deleteSourceAction(id: string): Promise<MutationState> {
  if (!isValidId(id)) {
    return { status: "error", message: "Invalid source id." };
  }

  const result = await deleteSource(id, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/sources");
  revalidatePath("/cabinet");
  redirect("/sources");
}
