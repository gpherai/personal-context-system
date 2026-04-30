import type { SavedFilterParams } from "@/domain/context";

export const systemSavedFilters: { name: string; params: SavedFilterParams }[] = [
  { name: "Active entries", params: { status: "active" } },
  { name: "Question entries", params: { type: "question" } },
  { name: "Sensitive records", params: { privacyLevel: "sensitive" } },
  { name: "Decisions", params: { type: "decision" } },
  { name: "Open loops", params: { type: "open_loop" } }
];

export function savedFilterHref(params: SavedFilterParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `/ledger?${query}` : "/ledger";
}
