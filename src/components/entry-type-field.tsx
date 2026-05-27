"use client";

import { useId, useState } from "react";

import { entryTypes, type EntryType } from "@/domain/context";
import { entryTypeDetails } from "@/domain/taxonomy";

export function EntryTypeField({ defaultValue = "observation" }: { defaultValue?: EntryType }) {
  const [value, setValue] = useState<EntryType>(defaultValue);
  const selectId = useId();
  const selectedDetail = entryTypeDetails[value];

  return (
    <label htmlFor={selectId} className="grid gap-1.5 text-sm font-medium">
      Type
      <select
        id={selectId}
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
      <span className="block text-xs leading-5 font-normal text-muted-foreground">
        {selectedDetail.description}
      </span>
    </label>
  );
}
