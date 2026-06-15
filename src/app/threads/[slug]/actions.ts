"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

export async function deleteThreadAction(threadId: string): Promise<void> {
  try {
    await createPrismaContextRepository().deleteThread(threadId);
  } catch (error) {
    if (isDatabaseUnavailable(error)) return;
    throw error;
  }

  revalidatePath("/threads");
  redirect("/threads");
}
