import { describe, expect, it } from "vitest";

import { parseClaudeConversation, type ClaudeExportConversation } from "./claude-export";

const ROOT = "00000000-0000-4000-8000-000000000000";

function textBlock(text: string) {
  return { type: "text", text };
}

function chatMessage(opts: {
  uuid: string;
  sender: "human" | "assistant";
  createdAt: string;
  content: unknown[];
  parent?: string;
  attachments?: unknown[];
  files?: unknown[];
}) {
  return {
    uuid: opts.uuid,
    sender: opts.sender,
    created_at: opts.createdAt,
    content: opts.content,
    parent_message_uuid: opts.parent ?? ROOT,
    attachments: opts.attachments ?? [],
    files: opts.files ?? []
  };
}

describe("parseClaudeConversation", () => {
  it("parses a simple linear conversation with no branching", () => {
    const raw: ClaudeExportConversation = {
      uuid: "conv-1",
      name: "Test conversation",
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:01:00.000Z",
      chat_messages: [
        chatMessage({ uuid: "m1", sender: "human", createdAt: "2025-01-01T00:00:00.000Z", content: [textBlock("hallo")] }),
        chatMessage({
          uuid: "m2",
          sender: "assistant",
          createdAt: "2025-01-01T00:00:30.000Z",
          content: [textBlock("hoi terug")],
          parent: "m1"
        })
      ]
    };

    const parsed = parseClaudeConversation(raw);

    expect(parsed.conversationId).toBe("conv-1");
    expect(parsed.messages.map((m) => m.text)).toEqual(["hallo", "hoi terug"]);
    expect(parsed.messages.every((m) => m.isActivePath)).toBe(true);
    expect(parsed.hasBranching).toBe(false);
    expect(parsed.messageCount).toBe(2);
  });

  it("flags only the chronologically-last sibling as the active path", () => {
    const raw: ClaudeExportConversation = {
      uuid: "conv-2",
      name: "Branch test",
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:05:00.000Z",
      chat_messages: [
        chatMessage({ uuid: "m1", sender: "human", createdAt: "2025-01-01T00:00:00.000Z", content: [textBlock("vraag")] }),
        chatMessage({
          uuid: "m2-first",
          sender: "assistant",
          createdAt: "2025-01-01T00:01:00.000Z",
          content: [textBlock("eerste antwoord")],
          parent: "m1"
        }),
        chatMessage({
          uuid: "m2-regenerated",
          sender: "assistant",
          createdAt: "2025-01-01T00:02:00.000Z",
          content: [textBlock("herzien antwoord")],
          parent: "m1"
        })
      ]
    };

    const parsed = parseClaudeConversation(raw);
    expect(parsed.hasBranching).toBe(true);

    const first = parsed.messages.find((m) => m.id === "m2-first")!;
    const regenerated = parsed.messages.find((m) => m.id === "m2-regenerated")!;
    expect(first.isActivePath).toBe(false);
    expect(regenerated.isActivePath).toBe(true);

    // body reconstructs only the active path
    expect(parsed.body).not.toContain("eerste antwoord");
    expect(parsed.body).toContain("herzien antwoord");
  });

  it("keeps only text blocks and records tool usage separately for interleaved turns", () => {
    const raw: ClaudeExportConversation = {
      uuid: "conv-3",
      name: "Tool use",
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      chat_messages: [
        chatMessage({
          uuid: "m1",
          sender: "assistant",
          createdAt: "2025-01-01T00:00:00.000Z",
          content: [
            textBlock("laat me dat bestand lezen"),
            { type: "tool_use", name: "read_file" },
            { type: "tool_result" },
            textBlock("klaar, hier is de inhoud")
          ]
        })
      ]
    };

    const parsed = parseClaudeConversation(raw);

    expect(parsed.messages).toHaveLength(1);
    expect(parsed.messages[0].text).toBe("laat me dat bestand lezen\n\nklaar, hier is de inhoud");
    expect(parsed.messages[0].toolsUsed).toEqual(["read_file"]);
    expect(parsed.toolUseCount).toBe(1);
    expect(parsed.toolNames).toEqual(["read_file"]);
  });

  it("folds attachment extracted_content into message text and records file metadata", () => {
    const raw: ClaudeExportConversation = {
      uuid: "conv-4",
      name: "Attachment",
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      chat_messages: [
        chatMessage({
          uuid: "m1",
          sender: "human",
          createdAt: "2025-01-01T00:00:00.000Z",
          content: [textBlock("kijk hier eens naar")],
          attachments: [{ file_name: "paste.txt", file_type: "txt", extracted_content: "console.log(1)" }]
        })
      ]
    };

    const parsed = parseClaudeConversation(raw);

    expect(parsed.messages[0].text).toContain("kijk hier eens naar");
    expect(parsed.messages[0].text).toContain("[bijlage: paste.txt]");
    expect(parsed.messages[0].text).toContain("console.log(1)");
    expect(parsed.messages[0].attachments).toEqual([{ fileName: "paste.txt", fileType: "txt" }]);
  });

  it("skips tool-only messages with no text but counts them separately", () => {
    const raw: ClaudeExportConversation = {
      uuid: "conv-5",
      name: "Tool only",
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      chat_messages: [
        chatMessage({ uuid: "m1", sender: "human", createdAt: "2025-01-01T00:00:00.000Z", content: [textBlock("doe dit")] }),
        chatMessage({
          uuid: "m2",
          sender: "assistant",
          createdAt: "2025-01-01T00:00:10.000Z",
          content: [{ type: "tool_use", name: "list_directory" }, { type: "tool_result" }],
          parent: "m1"
        })
      ]
    };

    const parsed = parseClaudeConversation(raw);

    expect(parsed.messages).toHaveLength(1);
    expect(parsed.toolOnlyMessageCount).toBe(1);
    expect(parsed.toolUseCount).toBe(1);
  });

  it("reports rawMessageCount 0 for a conversation with no chat_messages at all", () => {
    const raw: ClaudeExportConversation = {
      uuid: "conv-6",
      name: "",
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      chat_messages: []
    };

    const parsed = parseClaudeConversation(raw);

    expect(parsed.rawMessageCount).toBe(0);
    expect(parsed.messageCount).toBe(0);
  });

  it("keeps rawMessageCount > 0 for an image-only message with no text, distinct from a truly empty conversation", () => {
    const raw: ClaudeExportConversation = {
      uuid: "conv-7",
      name: "Image only",
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      chat_messages: [
        chatMessage({
          uuid: "m1",
          sender: "human",
          createdAt: "2025-01-01T00:00:00.000Z",
          content: [],
          files: [{ file_uuid: "f1", file_name: "photo.png" }]
        })
      ]
    };

    const parsed = parseClaudeConversation(raw);

    expect(parsed.rawMessageCount).toBe(1);
    expect(parsed.messageCount).toBe(0);
  });
});
