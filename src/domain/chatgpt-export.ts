// Pure parsing for a single conversation object out of a ChatGPT data export
// (`conversations-*.json`). No Prisma/zip access here so this stays unit-testable
// without a database or the export file itself.

export interface ChatGptExportMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
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
}

interface ChatGptMappingMessage {
  author?: { role?: unknown };
  content?: { content_type?: unknown; parts?: unknown };
  create_time?: unknown;
}

interface ChatGptMappingNode {
  message?: ChatGptMappingMessage | null;
}

export interface ChatGptExportConversation {
  conversation_id?: unknown;
  id?: unknown;
  title?: unknown;
  create_time?: unknown;
  update_time?: unknown;
  default_model_slug?: unknown;
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

export function parseChatGptConversation(raw: ChatGptExportConversation): ParsedChatGptConversation {
  const conversationId =
    (typeof raw.conversation_id === "string" && raw.conversation_id) ||
    (typeof raw.id === "string" && raw.id) ||
    "";

  const title = (typeof raw.title === "string" && raw.title.trim()) || "Untitled conversation";
  const model = typeof raw.default_model_slug === "string" ? raw.default_model_slug : undefined;

  const mapping = raw.mapping && typeof raw.mapping === "object" ? (raw.mapping as Record<string, ChatGptMappingNode>) : {};

  const messages: (ChatGptExportMessage & { createTime: number })[] = [];

  for (const node of Object.values(mapping)) {
    const message = node.message;
    if (!message) continue;

    const role = message.author?.role;
    if (role !== "user" && role !== "assistant") continue;

    if (message.content?.content_type !== "text") continue;

    const text = textFromParts(message.content?.parts);
    if (!text) continue;

    const createTime = typeof message.create_time === "number" ? message.create_time : 0;

    messages.push({
      role,
      text,
      timestamp: unixToIso(message.create_time) ?? new Date(0).toISOString(),
      createTime
    });
  }

  messages.sort((a, b) => a.createTime - b.createTime);

  const cleanMessages: ChatGptExportMessage[] = messages.map(({ role, text, timestamp }) => ({ role, text, timestamp }));

  return {
    conversationId,
    title,
    model,
    createdAt: unixToIso(raw.create_time) ?? new Date(0).toISOString(),
    updatedAt: unixToIso(raw.update_time) ?? new Date(0).toISOString(),
    messages: cleanMessages,
    messageCount: cleanMessages.length,
    body: messageToBody(cleanMessages)
  };
}
