"use client";

import { useState } from "react";

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

  const filtered = themes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
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
      <input
        aria-hidden="true"
        name={name}
        type="hidden"
        value={Array.from(selected).join(",")}
      />
      <input
        aria-label="Zoek thema's"
        className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Zoeken…"
        type="search"
        value={search}
      />
      <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-surface">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">Geen thema&apos;s gevonden</p>
        ) : (
          filtered.map((theme) => (
            <label
              key={theme.id}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-surface-muted"
            >
              <input
                checked={selected.has(theme.id)}
                className="h-4 w-4 rounded border border-border accent-primary"
                onChange={() => toggle(theme.id)}
                type="checkbox"
              />
              {theme.name}
            </label>
          ))
        )}
      </div>
      {selected.size > 0 && (
        <p className="text-xs text-muted-foreground">{selected.size} thema{selected.size !== 1 ? "&apos;s" : ""} geselecteerd</p>
      )}
    </div>
  );
}
