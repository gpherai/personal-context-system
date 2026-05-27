"use client";

import { useId, useState } from "react";

import { entryTypes, type EntryType } from "@/domain/context";
import { entryTypeDetails } from "@/domain/taxonomy";

export function EntryTypeField({ defaultValue = "observation" }: { defaultValue?: EntryType }) {
  const [value, setValue] = useState<EntryType>(defaultValue);
  const baseId = useId();
  const selectId = `${baseId}-select`;
  const descriptionId = `${baseId}-desc`;
  const selectedDetail = entryTypeDetails[value];

  return (
    <div className="grid gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium">Type</label>
      <select
        id={selectId}
        aria-describedby={descriptionId}
        className="field-select"
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
    </div>
  );
}
