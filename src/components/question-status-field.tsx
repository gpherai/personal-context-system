"use client";

import { useId, useState } from "react";

import { questionStatuses, type QuestionStatus } from "@/domain/context";
import { questionStatusDetails } from "@/domain/taxonomy";

export function QuestionStatusField({ defaultValue }: { defaultValue: QuestionStatus }) {
  const [value, setValue] = useState<QuestionStatus>(defaultValue);
  const descriptionId = useId();
  const selectedDetail = questionStatusDetails[value];

  return (
    <label className="grid gap-2 text-sm font-medium">
      Status
      <select
        aria-describedby={descriptionId}
        className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        name="status"
        value={value}
        onChange={(event) => setValue(event.target.value as QuestionStatus)}
      >
        {questionStatuses.map((status) => (
          <option key={status} value={status}>
            {questionStatusDetails[status].label}
          </option>
        ))}
      </select>
      <p id={descriptionId} className="text-xs leading-5 text-muted-foreground">
        {selectedDetail.description}
      </p>
    </label>
  );
}
