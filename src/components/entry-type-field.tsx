"use client";

import { useId, useState } from "react";

import { entryTypes, type EntryType } from "@/domain/context";
import { entryTypeDetails } from "@/domain/taxonomy";

export function EntryTypeField({ defaultValue = "observation" }: { defaultValue?: EntryType }) {
  const [value, setValue] = useState<EntryType>(defaultValue);
  const descriptionId = useId();
  const selectedDetail = entryTypeDetails[value];

  return (
    <label className="grid gap-2 text-sm font-medium">
      Type
      <select
        aria-describedby={descriptionId}
        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        name="type"
        value={value}
        onChange={(event) => setValue(event.target.value as EntryType)}
      >
        {entryTypes.map((type) => (
          <option key={type} value={type}>
            {entryTypeDetails[type].label}
          </option>
        ))}
      </select>
      <p id={descriptionId} className="text-xs leading-5 text-muted-foreground">
        {selectedDetail.description}
      </p>
    </label>
  );
}
