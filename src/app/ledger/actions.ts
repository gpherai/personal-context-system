"use server";

import { revalidatePath } from "next/cache";

import { createSavedFilterFromForm, initialMutationState, type MutationState } from "@/application/context-service";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

export { initialMutationState };

export async function createSavedFilterAction(
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  const result = await createSavedFilterFromForm(formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/ledger");
  revalidatePath("/command");
  return { status: "success", message: "Filter saved." };
}
