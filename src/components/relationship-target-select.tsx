"use client";

import { useMemo, useState } from "react";

import type { RelationshipTarget, RelationshipTargetType } from "@/repositories/context-repository";

const targetGroupLabels: Record<RelationshipTargetType, string> = {
  entry: "Entries",
  theme: "Themes",
  project: "Projects",
  question: "Questions",
  thread: "Threads",
  reference: "References",
  attachment: "Attachments"
};

const targetOrder: RelationshipTargetType[] = [
  "entry",
  "question",
  "project",
  "theme",
  "thread",
  "reference",
  "attachment"
];

function targetValue(target: RelationshipTarget) {
  return `${target.objectType}:${target.objectId}`;
}

function optionLabel(target: RelationshipTarget) {
  return target.detail ? `${target.label} - ${target.detail}` : target.label;
}

export function RelationshipTargetSelect({
  targets,
  source
}: {
  targets: RelationshipTarget[];
  source: { objectType: RelationshipTargetType; objectId: string };
}) {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState("");
  const availableTargets = targets.filter(
    (target) => target.objectType !== source.objectType || target.objectId !== source.objectId
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTargets = useMemo(() => {
    if (!normalizedQuery) {
      return availableTargets;
    }

    return availableTargets.filter((target) =>
      [target.objectType, target.label, target.detail].some((part) => part?.toLowerCase().includes(normalizedQuery))
    );
  }, [availableTargets, normalizedQuery]);
  const selectedTarget = availableTargets.find((target) => targetValue(target) === value);
  const visibleTargets =
    selectedTarget && !filteredTargets.some((target) => targetValue(target) === value)
      ? [selectedTarget, ...filteredTargets]
      : filteredTargets;

  return (
    <div className="grid gap-3">
      <label className="grid gap-2 text-sm font-medium">
        Find target
        <input
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search entries, questions, projects, themes, threads, references"
          type="search"
          value={query}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Target
        <select
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          disabled={availableTargets.length === 0}
          name="target"
          onChange={(event) => setValue(event.target.value)}
          required
          value={value}
        >
          <option value="" disabled>
            {visibleTargets.length ? "Choose a target" : "No matching targets"}
          </option>
          {targetOrder.map((type) => {
            const groupTargets = visibleTargets.filter((target) => target.objectType === type);

            if (!groupTargets.length) {
              return null;
            }

            return (
              <optgroup key={type} label={targetGroupLabels[type]}>
                {groupTargets.map((target) => (
                  <option key={targetValue(target)} value={targetValue(target)}>
                    {optionLabel(target)}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </label>
      {availableTargets.length === 0 && <span className="text-xs text-muted-foreground">No linkable targets yet.</span>}
    </div>
  );
}
