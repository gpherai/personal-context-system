"use server";

import { revalidatePath } from "next/cache";

import { generateContextBundle, rebuildMirror } from "@/application/context-service";
import { databaseMutationErrorState, isDatabaseUnavailable } from "@/application/errors";
import {
  bundleSelectionSchema,
  parseLineList,
  parseNameList,
  parseOptionalDate,
  type BundleManifest
} from "@/domain/context";

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
  } catch (error) {
    console.error("[rebuildMirrorAction] mirror build failed:", error);
    return {
      status: "error",
      message: "Context mirror generation failed."
    };
  }
}

export type GenerateBundleState = {
  status: "idle" | "success" | "error";
  message?: string;
  manifest?: BundleManifest;
};

export const initialGenerateBundleState: GenerateBundleState = {
  status: "idle"
};

export async function generateBundleAction(
  _previousState: GenerateBundleState,
  formData: FormData
): Promise<GenerateBundleState> {
  const parsed = bundleSelectionSchema.safeParse({
    privacyFloor: formData.get("privacyFloor"),
    recordTypes: formData.getAll("recordTypes"),
    sourceTypes: formData.getAll("sourceTypes"),
    themeSlugs: parseNameList(formData.get("themeSlugs") as string | null),
    occurredFrom: parseOptionalDate(formData.get("occurredFrom") as string | null),
    occurredTo: parseOptionalDate(formData.get("occurredTo") as string | null),
    ids: parseLineList(formData.get("ids") as string | null)
  });
  if (!parsed.success) {
    return { status: "error", message: "Check the bundle selection fields." };
  }

  try {
    const { manifest } = await generateContextBundle(parsed.data);
    return {
      status: "success",
      message: `Generated bundle at "${manifest.privacyFloor}" floor.`,
      manifest
    };
  } catch (error) {
    if (isDatabaseUnavailable(error)) return databaseMutationErrorState();
    console.error("[generateBundleAction] bundle generation failed:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Bundle generation failed."
    };
  }
}
