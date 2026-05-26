"use server";

import { revalidatePath } from "next/cache";

import { rebuildMirror } from "@/application/context-service";

export type RebuildMirrorState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialRebuildMirrorState: RebuildMirrorState = {
  status: "idle"
};

export async function rebuildMirrorAction(): Promise<RebuildMirrorState> {
  try {
    const result = await rebuildMirror();
    revalidatePath("/command");
    return {
      status: "success",
      message: `Generated ${result.fileCount} files in ${result.outputDir}.`
    };
  } catch {
    return {
      status: "error",
      message: "Context mirror generation failed."
    };
  }
}
