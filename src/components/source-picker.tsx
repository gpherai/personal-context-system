"use client";

import { useState } from "react";

import type { SourceType } from "@/domain/context";

interface SourceOption {
  id: string;
  type: SourceType;
  title: string;
}

interface SourcePickerProps {
  sources: SourceOption[];
  selectedIds: string[];
  name: string;
  label?: string;
}

export function SourcePicker({ sources, selectedIds, name, label }: SourcePickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [search, setSearch] = useState("");

  const filtered = sources.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
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
      <input aria-hidden="true" name={name} type="hidden" value={Array.from(selected).join(",")} />
      {label && <span className="text-sm font-medium">{label}</span>}
      <input
        aria-label={`Zoek ${label ?? "bronnen"}`}
        className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Zoeken…"
        type="search"
        value={search}
      />
      <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-surface">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">Geen resultaten</p>
        ) : (
          filtered.map((source) => (
            <label
              key={source.id}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-surface-muted"
            >
              <input
                checked={selected.has(source.id)}
                className="h-4 w-4 rounded border border-border accent-primary"
                onChange={() => toggle(source.id)}
                type="checkbox"
              />
              {source.title}
            </label>
          ))
        )}
      </div>
      {selected.size > 0 && (
        <p className="text-xs text-muted-foreground">{selected.size} geselecteerd</p>
      )}
    </div>
  );
}
