"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DATABASE_UNAVAILABLE_MESSAGE, isRecoverableReadError } from "@/application/errors";
import {
  initialMutationState,
  updateEntryFromForm,
  type MutationState
} from "@/application/context-service";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

export { initialMutationState };

export async function updateEntryAction(
  id: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  const result = await updateEntryFromForm(id, formData, createPrismaContextRepository()).catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return {
        ok: false as const,
        state: {
          status: "error" as const,
          message: DATABASE_UNAVAILABLE_MESSAGE
        }
      };
    }

    throw error;
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/");
  revalidatePath("/ledger");
  revalidatePath("/cabinet");
  revalidatePath(`/entries/${id}`);
  redirect(`/entries/${id}`);
}
