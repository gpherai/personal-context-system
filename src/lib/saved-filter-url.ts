import type { SavedFilterParams } from "@/domain/context";

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
