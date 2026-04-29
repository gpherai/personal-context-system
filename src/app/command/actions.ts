"use server";

import { revalidatePath } from "next/cache";

import { rebuildContextMirror } from "@/infrastructure/files/context-mirror-writer";

export type RebuildMirrorState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialRebuildMirrorState: RebuildMirrorState = {
  status: "idle"
};

export async function rebuildMirrorAction(): Promise<RebuildMirrorState> {
  try {
    const result = await rebuildContextMirror();
    revalidatePath("/command");
    return {
      status: "success",
      message: `Generated ${result.fileCount} files in ${result.outputDir}.`
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Context mirror generation failed."
    };
  }
}
