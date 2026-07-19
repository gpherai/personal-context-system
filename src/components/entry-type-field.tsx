"use client";

import { useState } from "react";

import { Field } from "@/components/ui";
import { entryTypes, type EntryType } from "@/domain/context";
import { entryTypeDetails } from "@/domain/taxonomy";

export function EntryTypeField({ defaultValue = "observation" }: { defaultValue?: EntryType }) {
  const [value, setValue] = useState<EntryType>(defaultValue);

  return (
    <Field name="type" label="Type" hint={entryTypeDetails[value].description}>
      {(p) => (
        <select
          className="field-select"
          value={value}
          onChange={(event) => setValue(event.target.value as EntryType)}
          {...p}
        >
          {entryTypes.map((type) => (
            <option key={type} value={type}>
              {entryTypeDetails[type].label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
