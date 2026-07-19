// Pure parsing for one Claude Code session transcript (a single
// `~/.claude/projects/<project>/<session-id>.jsonl` file, already split into
// lines and JSON.parsed by the caller). No fs access here so this stays
// unit-testable without real session files.
//
// Unlike the ChatGPT/Claude.ai exports, this is a raw agent event log, not a
// purpose-built conversation export: most "user" events are actually tool_result
// echoes (the output of a Read/Bash/etc. call fed back to the model), and most
// "assistant" events interleave tool_use/thinking blocks with the actual reply.
// The scope here is deliberately narrow — only the human-authored prompts and
// the assistant's final text replies — everything else (tool calls, edits,
// hook/skill-instruction injections, thinking) is dropped from the message
// body and only surfaces in aggregate as `toolNames`/`skillsUsed` on the
// conversation as a whole.

// Synthetic wrapper tags Claude Code (or its hooks) inject into "user" turns
// that were never typed by a human: slash-command echoes, local-command
// stdout/caveat wrappers, and background-task notifications. A message that
// is *entirely* one of these (nothing left after stripping) is not human
// input and is dropped; a message that merely contains one alongside real
// text keeps its residual text.
const WRAPPER_TAG_PATTERN =
  /<(system-reminder|local-command-caveat|local-command-stdout|command-name|command-message|command-args|task-notification)\b[^>]*>[\s\S]*?<\/\1>/g;

export interface ClaudeCodeMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  model?: string;
}

export interface ParsedClaudeCodeSession {
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ClaudeCodeMessage[];
  messageCount: number;
  rawEventCount: number;
  body: string;
  charCount: number;
  toolUseCount: number;
  toolNames: string[];
  skillsUsed: string[];
  hasThinking: boolean;
  projectDir?: string;
  model?: string;
  models: string[];
}

interface ClaudeCodeContentBlock {
  type?: unknown;
  text?: unknown;
  name?: unknown;
  input?: unknown;
}

interface ClaudeCodeMessagePayload {
  role?: unknown;
  content?: unknown;
  model?: unknown;
}

export interface ClaudeCodeSessionEvent {
  type?: unknown;
  uuid?: unknown;
  timestamp?: unknown;
  isMeta?: unknown;
  isSidechain?: unknown;
  cwd?: unknown;
  sessionId?: unknown;
  aiTitle?: unknown;
  message?: ClaudeCodeMessagePayload;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function stripWrapperTags(content: string): string {
  return content.replace(WRAPPER_TAG_PATTERN, "").trim();
}

function textFromBlocks(blocks: ClaudeCodeContentBlock[]): string {
  return blocks
    .filter((b) => b.type === "text")
    .map((b) => asString(b.text)?.trim())
    .filter((t): t is string => Boolean(t))
    .join("\n\n");
}

function extractUserText(payload: ClaudeCodeMessagePayload): string | undefined {
  const content = payload.content;

  if (typeof content === "string") {
    const stripped = stripWrapperTags(content);
    return stripped.length > 0 ? stripped : undefined;
  }

  if (Array.isArray(content)) {
    const text = textFromBlocks(content as ClaudeCodeContentBlock[]);
    if (!text) return undefined; // tool_result / image-only turn, no human text
    const stripped = stripWrapperTags(text);
    return stripped.length > 0 ? stripped : undefined;
  }

  return undefined;
}

function extractAssistantText(payload: ClaudeCodeMessagePayload): string | undefined {
  const content = payload.content;
  if (!Array.isArray(content)) return undefined;
  const text = textFromBlocks(content as ClaudeCodeContentBlock[]);
  return text.length > 0 ? text : undefined;
}

function collectToolUse(
  payload: ClaudeCodeMessagePayload,
  toolNames: Set<string>,
  skillsUsed: Set<string>
): boolean {
  const content = payload.content;
  if (!Array.isArray(content)) return false;

  let count = 0;
  for (const raw of content as ClaudeCodeContentBlock[]) {
    if (raw.type !== "tool_use") continue;
    count++;
    const name = asString(raw.name);
    if (!name) continue;
    toolNames.add(name);
    if (name === "Skill") {
      const input = raw.input;
      const skill = input && typeof input === "object" ? asString((input as { skill?: unknown }).skill) : undefined;
      if (skill) skillsUsed.add(skill);
    }
  }
  return count > 0;
}

function hasThinkingBlock(payload: ClaudeCodeMessagePayload): boolean {
  const content = payload.content;
  if (!Array.isArray(content)) return false;
  return (content as ClaudeCodeContentBlock[]).some((b) => b.type === "thinking");
}

function fallbackTitle(messages: ClaudeCodeMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "Untitled session";
  const firstLine = firstUser.text.split("\n").find((line) => line.trim().length > 0)?.trim();
  if (!firstLine) return "Untitled session";
  return firstLine.length > 140 ? `${firstLine.slice(0, 140)}...` : firstLine;
}

export function parseClaudeCodeSession(sessionId: string, rawEvents: unknown[]): ParsedClaudeCodeSession {
  const events = rawEvents.filter((e): e is ClaudeCodeSessionEvent => Boolean(e) && typeof e === "object");

  const messages: ClaudeCodeMessage[] = [];
  const toolNames = new Set<string>();
  const skillsUsed = new Set<string>();
  const models = new Set<string>();
  let toolUseCount = 0;
  let hasThinking = false;
  let lastAiTitle: string | undefined;
  let projectDir: string | undefined;
  let minTimestamp: string | undefined;
  let maxTimestamp: string | undefined;

  for (const event of events) {
    const timestamp = asString(event.timestamp);
    if (timestamp) {
      if (!minTimestamp || timestamp < minTimestamp) minTimestamp = timestamp;
      if (!maxTimestamp || timestamp > maxTimestamp) maxTimestamp = timestamp;
    }

    if (!projectDir) {
      const cwd = asString(event.cwd);
      if (cwd) projectDir = cwd.split("/").filter(Boolean).pop();
    }

    if (event.type === "ai-title") {
      const title = asString(event.aiTitle);
      if (title) lastAiTitle = title;
      continue;
    }

    if (event.type !== "user" && event.type !== "assistant") continue;
    if (event.isSidechain === true) continue;

    const payload = event.message;
    if (!payload) continue;

    if (event.type === "user") {
      if (event.isMeta === true) continue;
      const text = extractUserText(payload);
      if (!text) continue;

      messages.push({
        id: asString(event.uuid) ?? crypto.randomUUID(),
        role: "user",
        text,
        timestamp: timestamp ?? new Date(0).toISOString()
      });
      continue;
    }

    // assistant
    const usedTools = collectToolUse(payload, toolNames, skillsUsed);
    if (usedTools) {
      // count each tool_use block, not just distinct-name turns
      const content = payload.content;
      if (Array.isArray(content)) {
        toolUseCount += (content as ClaudeCodeContentBlock[]).filter((b) => b.type === "tool_use").length;
      }
    }
    if (hasThinkingBlock(payload)) hasThinking = true;

    const model = asString(payload.model);
    if (model) models.add(model);

    const text = extractAssistantText(payload);
    if (!text) continue; // pure tool-call/thinking turn, no reply text

    messages.push({
      id: asString(event.uuid) ?? crypto.randomUUID(),
      role: "assistant",
      text,
      timestamp: timestamp ?? new Date(0).toISOString(),
      model
    });
  }

  const body = messages.map((m) => `[${m.role}] ${m.text}`).join("\n\n");
  const charCount = messages.reduce((sum, m) => sum + m.text.length, 0);
  const title = lastAiTitle ?? fallbackTitle(messages);
  const modelList = [...models];

  return {
    sessionId,
    title,
    createdAt: minTimestamp ?? new Date(0).toISOString(),
    updatedAt: maxTimestamp ?? minTimestamp ?? new Date(0).toISOString(),
    messages,
    messageCount: messages.length,
    rawEventCount: events.length,
    body,
    charCount,
    toolUseCount,
    toolNames: [...toolNames],
    skillsUsed: [...skillsUsed],
    hasThinking,
    projectDir,
    model: modelList[modelList.length - 1],
    models: modelList
  };
}
