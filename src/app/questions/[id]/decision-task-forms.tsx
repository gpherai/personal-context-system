"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { decisionStatuses, taskStatuses, type DecisionStatus, type TaskStatus } from "@/domain/context";
import { formatDate, labelize } from "@/lib/format";
import { FormMessage } from "@/components/form-message";

import { initialMutationState } from "@/application/action-states";

import {
  createDecisionAction,
  createTaskAction,
  updateDecisionStatusAction,
  updateTaskStatusAction
} from "./actions";

interface DecisionDto {
  id: string;
  decisionText: string;
  status: DecisionStatus;
  decidedAt?: Date;
  createdAt: Date;
}

interface TaskDto {
  id: string;
  nextAction: string;
  status: TaskStatus;
  dueAt?: Date;
}

export function DecisionForm({ questionId }: { questionId: string }) {
  const actionWithQuestion = createDecisionAction.bind(null, questionId);
  const [state, action, pending] = useActionState(actionWithQuestion, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5 text-sm font-medium">
        Decision
        <textarea
          className="field-textarea min-h-20"
          name="decisionText"
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Status
        <select className="field-select" name="status" defaultValue="proposed">
          <option value="proposed">{labelize("proposed")}</option>
          <option value="accepted">{labelize("accepted")}</option>
          <option value="deferred">{labelize("deferred")}</option>
        </select>
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add decision"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function DecisionStatusForm({ decision, questionId }: { decision: DecisionDto; questionId: string }) {
  const nextStatuses: Record<DecisionStatus, DecisionStatus[]> = {
    proposed: ["accepted", "deferred"],
    deferred: ["follow_up_planned"],
    follow_up_planned: ["closed"],
    accepted: ["closed"],
    closed: []
  };
  const options = nextStatuses[decision.status];
  const actionWithIds = updateDecisionStatusAction.bind(null, decision.id, decision.status, questionId);
  const [state, action, pending] = useActionState(actionWithIds, initialMutationState);

  if (options.length === 0) {
    return null;
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <select className="field-select" name="status" defaultValue={options[0]}>
        {options.map((status) => (
          <option key={status} value={status}>{labelize(status)}</option>
        ))}
      </select>
      <Button type="submit" disabled={pending} variant="ghost">
        {pending ? "..." : "Update"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}

export function DecisionHistory({ decisions, questionId }: { decisions: DecisionDto[]; questionId: string }) {
  if (decisions.length === 0) {
    return <p className="text-sm text-muted-foreground">No decisions yet.</p>;
  }

  return (
    <ul className="grid gap-3">
      {decisions.map((decision) => (
        <li key={decision.id} className="rounded-md border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge tone={decision.status === "closed" ? "neutral" : "blue"}>{labelize(decision.status)}</Badge>
            <span className="text-xs text-muted-foreground">{formatDate(decision.decidedAt ?? decision.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm leading-6">{decision.decisionText}</p>
          <div className="mt-2">
            <DecisionStatusForm decision={decision} questionId={questionId} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TaskForm({ questionId }: { questionId: string }) {
  const actionWithQuestion = createTaskAction.bind(null, questionId);
  const [state, action, pending] = useActionState(actionWithQuestion, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5 text-sm font-medium">
        Next action
        <textarea
          className="field-textarea min-h-16"
          name="nextAction"
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Due date
        <input className="field-select" type="date" name="dueAt" />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add task"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function TaskStatusForm({ task, questionId }: { task: TaskDto; questionId: string }) {
  const actionWithIds = updateTaskStatusAction.bind(null, task.id, questionId);
  const [state, action, pending] = useActionState(actionWithIds, initialMutationState);

  return (
    <form action={action} className="flex items-center gap-2">
      <select className="field-select" name="status" defaultValue={task.status}>
        {taskStatuses.map((status) => (
          <option key={status} value={status}>{labelize(status)}</option>
        ))}
      </select>
      <Button type="submit" disabled={pending} variant="ghost">
        {pending ? "..." : "Update"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}

export function TaskList({ tasks, questionId }: { tasks: TaskDto[]; questionId: string }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks yet.</p>;
  }

  return (
    <ul className="grid gap-3">
      {tasks.map((task) => (
        <li key={task.id} className="rounded-md border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge>{labelize(task.status)}</Badge>
            {task.dueAt && <span className="text-xs text-muted-foreground">Due {formatDate(task.dueAt)}</span>}
          </div>
          <p className="mt-2 text-sm leading-6">{task.nextAction}</p>
          <div className="mt-2">
            <TaskStatusForm task={task} questionId={questionId} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const knownDecisionStatuses = decisionStatuses;
