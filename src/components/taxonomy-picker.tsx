"use client";

import { useDeferredValue, useMemo, useState } from "react";

interface Theme {
  id: string;
  name: string;
  slug: string;
}

interface TaxonomyPickerProps {
  themes: Theme[];
  selectedIds: string[];
  name?: string;
}

export function TaxonomyPicker({ themes, selectedIds, name = "themeIds" }: TaxonomyPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(
    () => themes.filter((t) => t.name.toLowerCase().includes(deferredSearch.toLowerCase())),
    [themes, deferredSearch]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-2">
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <input
        aria-label="Search themes"
        className="field-input"
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search…"
        type="search"
        value={search}
      />
      <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-surface">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">No themes found</p>
        ) : (
          filtered.map((theme) => (
            <label
              key={theme.id}
              // min-h-11 keeps the whole row a 44px touch target; the box alone
              // was 16px, well under the threshold.
              className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors duration-150 hover:bg-surface-muted"
            >
              <input
                checked={selected.has(theme.id)}
                className="h-5 w-5 shrink-0 cursor-pointer rounded border border-border accent-primary"
                onChange={() => toggle(theme.id)}
                type="checkbox"
              />
              {theme.name}
            </label>
          ))
        )}
      </div>
      {selected.size > 0 && (
        <p className="text-xs text-muted-foreground">{selected.size} theme{selected.size !== 1 ? "s" : ""} selected</p>
      )}
    </div>
  );
}
