"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { captureEntry, type CaptureEntryState } from "@/application/context-service";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

export async function createEntryAction(
  _previousState: CaptureEntryState,
  formData: FormData
): Promise<CaptureEntryState> {
  const result = await captureEntry(formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/");
  revalidatePath("/ledger");
  revalidatePath("/cabinet");
  revalidatePath("/map");
  redirect(`/entries/${result.entry.id}`);
}
