export type CaptureEntryState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialCaptureEntryState: CaptureEntryState = {
  status: "idle"
};

export type MutationState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialMutationState: MutationState = {
  status: "idle"
};
