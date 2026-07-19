// Pure parsing for a single conversation object out of a Claude.ai data export
// (`conversations.json`). No Prisma/zip access here so this stays unit-testable
// without a database or the export file itself.
//
// Unlike ChatGPT's export, Claude's `chat_messages` is a flat array (not an
// id-keyed mapping) and carries no `current_node` pointer to the active branch.
// Sibling messages sharing a `parent_message_uuid` represent edits/regenerations;
// we keep every branch (position = original array index) and compute an
// `isActivePath` flag per message so a default linear reading can be reconstructed
// without discarding the abandoned branches.

const ROOT_SENTINEL = "00000000-0000-4000-8000-000000000000";

export interface ClaudeExportMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  parentMessageUuid: string;
  isActivePath: boolean;
  toolsUsed: string[];
  hasThinking: boolean;
  attachments: { fileName: string; fileType?: string }[];
  files: { fileName: string }[];
}

export interface ParsedClaudeConversation {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ClaudeExportMessage[];
  messageCount: number;
  rawMessageCount: number;
  toolOnlyMessageCount: number;
  body: string;
  charCount: number;
  hasBranching: boolean;
  toolUseCount: number;
  toolNames: string[];
  hasThinking: boolean;
}

interface ClaudeContentBlock {
  type?: unknown;
  text?: unknown;
  name?: unknown;
}

interface ClaudeExportAttachment {
  file_name?: unknown;
  file_type?: unknown;
  extracted_content?: unknown;
}

interface ClaudeExportFile {
  file_name?: unknown;
}

interface ClaudeExportChatMessage {
  uuid?: unknown;
  content?: unknown;
  sender?: unknown;
  created_at?: unknown;
  attachments?: unknown;
  files?: unknown;
  parent_message_uuid?: unknown;
}

export interface ClaudeExportConversation {
  uuid?: unknown;
  name?: unknown;
  summary?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  chat_messages?: unknown;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

interface RawMessageInfo {
  id: string;
  parentMessageUuid: string;
  createdAt: string;
  role: "user" | "assistant";
  text: string;
  toolsUsed: string[];
  hasThinking: boolean;
  attachments: { fileName: string; fileType?: string }[];
  files: { fileName: string }[];
  hadAnyContent: boolean;
}

function extractRawMessage(raw: ClaudeExportChatMessage): RawMessageInfo | undefined {
  const id = asString(raw.uuid);
  if (!id) return undefined;

  const role = raw.sender === "human" ? "user" : raw.sender === "assistant" ? "assistant" : undefined;
  if (!role) return undefined;

  const blocks = Array.isArray(raw.content) ? (raw.content as ClaudeContentBlock[]) : [];
  const textParts: string[] = [];
  const toolsUsed = new Set<string>();
  let hasThinking = false;

  for (const block of blocks) {
    if (block.type === "text") {
      const text = asString(block.text)?.trim();
      if (text) textParts.push(text);
    } else if (block.type === "tool_use") {
      const name = asString(block.name);
      if (name) toolsUsed.add(name);
    } else if (block.type === "thinking") {
      hasThinking = true;
    }
  }

  const attachments: { fileName: string; fileType?: string }[] = [];
  const rawAttachments = Array.isArray(raw.attachments) ? (raw.attachments as ClaudeExportAttachment[]) : [];
  for (const attachment of rawAttachments) {
    const fileName = asString(attachment.file_name);
    if (!fileName) continue;
    attachments.push({ fileName, fileType: asString(attachment.file_type) });
    const extracted = asString(attachment.extracted_content)?.trim();
    if (extracted) {
      textParts.push(`---\n[bijlage: ${fileName}]\n${extracted}`);
    }
  }

  const files: { fileName: string }[] = [];
  const rawFiles = Array.isArray(raw.files) ? (raw.files as ClaudeExportFile[]) : [];
  for (const file of rawFiles) {
    const fileName = asString(file.file_name);
    if (fileName) files.push({ fileName });
  }

  return {
    id,
    parentMessageUuid: asString(raw.parent_message_uuid) ?? ROOT_SENTINEL,
    createdAt: asString(raw.created_at) ?? new Date(0).toISOString(),
    role,
    text: textParts.join("\n\n").trim(),
    toolsUsed: [...toolsUsed],
    hasThinking,
    attachments,
    files,
    hadAnyContent: blocks.length > 0 || rawAttachments.length > 0
  };
}

// A message is on the active path only if it — and every ancestor up to the
// root — was each time the chronologically-last child among its siblings.
// Abandoned branches (regenerated/edited-away messages) are kept but flagged false.
function computeActivePaths(messages: RawMessageInfo[]): Map<string, boolean> {
  const byParent = new Map<string, RawMessageInfo[]>();
  for (const message of messages) {
    const siblings = byParent.get(message.parentMessageUuid) ?? [];
    siblings.push(message);
    byParent.set(message.parentMessageUuid, siblings);
  }

  const localActiveChild = new Map<string, string>();
  for (const [parent, siblings] of byParent) {
    const latest = siblings.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
    localActiveChild.set(parent, latest.id);
  }

  const byId = new Map(messages.map((m) => [m.id, m]));
  const resolved = new Map<string, boolean>();

  function resolve(id: string, visiting: Set<string>): boolean {
    if (resolved.has(id)) return resolved.get(id)!;
    if (visiting.has(id)) return false; // cycle guard
    visiting.add(id);

    const message = byId.get(id);
    if (!message) {
      resolved.set(id, false);
      return false;
    }

    const isLocalActive = localActiveChild.get(message.parentMessageUuid) === id;
    const parentActive = message.parentMessageUuid === ROOT_SENTINEL || !byId.has(message.parentMessageUuid)
      ? true
      : resolve(message.parentMessageUuid, visiting);

    const result = isLocalActive && parentActive;
    resolved.set(id, result);
    return result;
  }

  for (const message of messages) {
    resolve(message.id, new Set());
  }

  return resolved;
}

function hasBranching(messages: RawMessageInfo[]): boolean {
  const counts = new Map<string, number>();
  for (const message of messages) {
    counts.set(message.parentMessageUuid, (counts.get(message.parentMessageUuid) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count > 1);
}

function messageToBody(messages: ClaudeExportMessage[]): string {
  return messages
    .filter((m) => m.isActivePath)
    .map((message) => `[${message.role}] ${message.text}`)
    .join("\n\n");
}

export function parseClaudeConversation(raw: ClaudeExportConversation): ParsedClaudeConversation {
  const conversationId = asString(raw.uuid) ?? "";
  const title = asString(raw.name)?.trim() || "Untitled conversation";

  const rawChatMessages = Array.isArray(raw.chat_messages) ? (raw.chat_messages as ClaudeExportChatMessage[]) : [];
  const rawMessages: RawMessageInfo[] = [];
  for (const rawMessage of rawChatMessages) {
    const parsed = extractRawMessage(rawMessage);
    if (parsed) rawMessages.push(parsed);
  }

  const activePaths = computeActivePaths(rawMessages);
  const branching = hasBranching(rawMessages);

  const messages: ClaudeExportMessage[] = [];
  let toolOnlyMessageCount = 0;
  const allToolNames = new Set<string>();
  let toolUseCount = 0;
  let anyThinking = false;

  for (const raw of rawMessages) {
    toolUseCount += raw.toolsUsed.length;
    for (const name of raw.toolsUsed) allToolNames.add(name);
    if (raw.hasThinking) anyThinking = true;

    if (!raw.text) {
      if (raw.hadAnyContent) toolOnlyMessageCount++;
      continue;
    }

    messages.push({
      id: raw.id,
      role: raw.role,
      text: raw.text,
      timestamp: raw.createdAt,
      parentMessageUuid: raw.parentMessageUuid,
      isActivePath: activePaths.get(raw.id) ?? false,
      toolsUsed: raw.toolsUsed,
      hasThinking: raw.hasThinking,
      attachments: raw.attachments,
      files: raw.files
    });
  }

  const charCount = messages.reduce((sum, m) => sum + m.text.length, 0);

  return {
    conversationId,
    title,
    createdAt: asString(raw.created_at) ?? new Date(0).toISOString(),
    updatedAt: asString(raw.updated_at) ?? new Date(0).toISOString(),
    messages,
    messageCount: messages.length,
    rawMessageCount: rawMessages.length,
    toolOnlyMessageCount,
    body: messageToBody(messages),
    charCount,
    hasBranching: branching,
    toolUseCount,
    toolNames: [...allToolNames],
    hasThinking: anyThinking
  };
}
