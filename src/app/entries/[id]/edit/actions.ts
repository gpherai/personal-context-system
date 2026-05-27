"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  initialMutationState,
  updateEntryFromForm,
  type MutationState
} from "@/application/context-service";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";

export { initialMutationState };

export async function updateEntryAction(
  id: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(id)) {
    return { status: "error", message: "Invalid entry id." };
  }

  const result = await updateEntryFromForm(id, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/");
  revalidatePath("/ledger");
  revalidatePath("/cabinet");
  revalidatePath("/map");
  revalidatePath(`/entries/${id}`);
  redirect(`/entries/${id}`);
}
