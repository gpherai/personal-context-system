// Pure parsing for a single conversation object out of a ChatGPT data export
// (`conversations-*.json`). No Prisma/zip access here so this stays unit-testable
// without a database or the export file itself.

export interface ChatGptExportMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  model?: string;
  urls: string[];
}

export interface ParsedChatGptConversation {
  conversationId: string;
  title: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatGptExportMessage[];
  messageCount: number;
  body: string;
  isArchived: boolean;
  isStarred: boolean;
  pinnedTime?: string;
  isStudyMode: boolean;
  models: string[];
  charCount: number;
  projectId?: string;
}

interface ChatGptMappingMessage {
  id?: unknown;
  author?: { role?: unknown };
  content?: { content_type?: unknown; parts?: unknown };
  create_time?: unknown;
  metadata?: { model_slug?: unknown; content_references?: unknown };
}

interface ChatGptMappingNode {
  message?: ChatGptMappingMessage | null;
  parent?: unknown;
}

export interface ChatGptExportConversation {
  conversation_id?: unknown;
  id?: unknown;
  title?: unknown;
  create_time?: unknown;
  update_time?: unknown;
  default_model_slug?: unknown;
  current_node?: unknown;
  is_archived?: unknown;
  is_starred?: unknown;
  pinned_time?: unknown;
  is_study_mode?: unknown;
  conversation_template_id?: unknown;
  mapping?: Record<string, ChatGptMappingNode> | unknown;
}

function unixToIso(value: unknown): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return new Date(value * 1000).toISOString();
}

function textFromParts(parts: unknown): string | undefined {
  if (!Array.isArray(parts) || parts.length === 0) {
    return undefined;
  }
  if (!parts.every((part): part is string => typeof part === "string")) {
    return undefined;
  }
  const text = parts.join("\n").trim();
  return text.length > 0 ? text : undefined;
}

function messageToBody(messages: ChatGptExportMessage[]): string {
  return messages.map((message) => `[${message.role}] ${message.text}`).join("\n\n");
}

// ChatGPT's content_references carry URLs at varying depths depending on the
// reference type (grouped_webpages, sources_footnote, webpage_extended, ...).
// Rather than modeling every shape, walk the structure and collect any string
// value stored under an "url" key that looks like an absolute http(s) URL.
function extractUrls(contentReferences: unknown): string[] {
  const found = new Set<string>();

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (value !== null && typeof value === "object") {
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        if (key === "url" && typeof val === "string" && /^https?:\/\//i.test(val)) {
          found.add(val);
        } else {
          walk(val);
        }
      }
    }
  }

  walk(contentReferences);
  return [...found];
}

// Reconstructs the active conversation path (root -> current_node) by following
// `parent` pointers backward from `current_node`. Off-path nodes (abandoned
// regenerations/edits) are never visited, so they're excluded by construction.
// Falls back to `undefined` when current_node is missing/invalid or the mapping
// has a cycle, so callers can fall back to a full-mapping scan.
function activePathNodeIds(mapping: Record<string, ChatGptMappingNode>, currentNode: unknown): string[] | undefined {
  if (typeof currentNode !== "string" || !mapping[currentNode]) {
    return undefined;
  }

  const path: string[] = [];
  const visited = new Set<string>();
  let cursor: string | undefined = currentNode;

  while (cursor !== undefined) {
    if (visited.has(cursor)) {
      return undefined; // cycle guard
    }
    visited.add(cursor);
    path.push(cursor);

    const node: ChatGptMappingNode | undefined = mapping[cursor];
    if (!node) {
      return undefined;
    }
    const parent: unknown = node.parent;
    cursor = typeof parent === "string" && mapping[parent] ? parent : undefined;
  }

  return path.reverse();
}

function nodeToMessage(node: ChatGptMappingNode): (ChatGptExportMessage & { createTime: number }) | undefined {
  const message = node.message;
  if (!message) return undefined;

  const role = message.author?.role;
  if (role !== "user" && role !== "assistant") return undefined;

  if (message.content?.content_type !== "text") return undefined;

  const text = textFromParts(message.content?.parts);
  if (!text) return undefined;

  const createTime = typeof message.create_time === "number" ? message.create_time : 0;
  const id = typeof message.id === "string" && message.id ? message.id : crypto.randomUUID();
  const model = typeof message.metadata?.model_slug === "string" ? message.metadata.model_slug : undefined;
  const urls = extractUrls(message.metadata?.content_references);

  return {
    id,
    role,
    text,
    timestamp: unixToIso(message.create_time) ?? new Date(0).toISOString(),
    model,
    urls,
    createTime
  };
}

export function parseChatGptConversation(raw: ChatGptExportConversation): ParsedChatGptConversation {
  const conversationId =
    (typeof raw.conversation_id === "string" && raw.conversation_id) ||
    (typeof raw.id === "string" && raw.id) ||
    "";

  const title = (typeof raw.title === "string" && raw.title.trim()) || "Untitled conversation";
  const model = typeof raw.default_model_slug === "string" ? raw.default_model_slug : undefined;

  const mapping = raw.mapping && typeof raw.mapping === "object" ? (raw.mapping as Record<string, ChatGptMappingNode>) : {};

  const activePath = activePathNodeIds(mapping, raw.current_node);
  const nodeIds = activePath ?? Object.keys(mapping);

  const withCreateTime: (ChatGptExportMessage & { createTime: number })[] = [];
  for (const nodeId of nodeIds) {
    const node = mapping[nodeId];
    if (!node) continue;
    const message = nodeToMessage(node);
    if (message) withCreateTime.push(message);
  }

  // Active-path order is already chronological (parent always precedes child);
  // the fallback (unordered mapping scan) still needs an explicit sort.
  if (!activePath) {
    withCreateTime.sort((a, b) => a.createTime - b.createTime);
  }

  const messages: ChatGptExportMessage[] = withCreateTime.map(({ createTime: _createTime, ...rest }) => rest);

  const models = [...new Set(messages.map((m) => m.model).filter((m): m is string => Boolean(m)))];
  const charCount = messages.reduce((sum, m) => sum + m.text.length, 0);

  return {
    conversationId,
    title,
    model,
    createdAt: unixToIso(raw.create_time) ?? new Date(0).toISOString(),
    updatedAt: unixToIso(raw.update_time) ?? new Date(0).toISOString(),
    messages,
    messageCount: messages.length,
    body: messageToBody(messages),
    isArchived: raw.is_archived === true,
    isStarred: raw.is_starred === true,
    pinnedTime: unixToIso(raw.pinned_time),
    isStudyMode: raw.is_study_mode === true,
    models,
    charCount,
    projectId: typeof raw.conversation_template_id === "string" ? raw.conversation_template_id : undefined
  };
}
