import { describe, expect, it } from "vitest";

import { parseChatGptConversation, type ChatGptExportConversation } from "./chatgpt-export";

function textMessage(role: "user" | "assistant", text: string, createTime: number) {
  return {
    message: {
      author: { role },
      content: { content_type: "text", parts: [text] },
      create_time: createTime
    }
  };
}

describe("parseChatGptConversation", () => {
  it("sorts out-of-order mapping nodes by create_time", () => {
    const raw: ChatGptExportConversation = {
      conversation_id: "conv_1",
      title: "Test",
      create_time: 1000,
      update_time: 2000,
      default_model_slug: "gpt-5",
      mapping: {
        second: textMessage("assistant", "second reply", 200),
        first: textMessage("user", "first message", 100),
        third: textMessage("user", "third message", 300)
      }
    };

    const parsed = parseChatGptConversation(raw);

    expect(parsed.messages.map((m) => m.text)).toEqual(["first message", "second reply", "third message"]);
    expect(parsed.messageCount).toBe(3);
  });

  it("skips mapping nodes with a null message (e.g. the root node)", () => {
    const raw: ChatGptExportConversation = {
      conversation_id: "conv_2",
      title: "Test",
      mapping: {
        root: { message: null },
        real: textMessage("user", "hello", 100)
      }
    };

    const parsed = parseChatGptConversation(raw);

    expect(parsed.messages).toHaveLength(1);
    expect(parsed.messages[0].text).toBe("hello");
  });

  it("skips thoughts, multimodal_text and other non-text content types", () => {
    const raw: ChatGptExportConversation = {
      conversation_id: "conv_3",
      title: "Test",
      mapping: {
        thought: {
          message: {
            author: { role: "assistant" },
            content: { content_type: "thoughts", parts: ["internal reasoning"] },
            create_time: 100
          }
        },
        multimodal: {
          message: {
            author: { role: "user" },
            content: { content_type: "multimodal_text", parts: [{ asset_pointer: "file-abc" }] },
            create_time: 200
          }
        },
        text: textMessage("assistant", "visible reply", 300)
      }
    };

    const parsed = parseChatGptConversation(raw);

    expect(parsed.messages).toHaveLength(1);
    expect(parsed.messages[0].text).toBe("visible reply");
  });

  it("skips empty messages", () => {
    const raw: ChatGptExportConversation = {
      conversation_id: "conv_4",
      title: "Test",
      mapping: {
        empty: textMessage("user", "", 100),
        blank: textMessage("assistant", "   ", 150),
        real: textMessage("user", "actual content", 200)
      }
    };

    const parsed = parseChatGptConversation(raw);

    expect(parsed.messages).toHaveLength(1);
    expect(parsed.messages[0].text).toBe("actual content");
  });

  it("falls back to a default title when none is provided", () => {
    const raw: ChatGptExportConversation = {
      conversation_id: "conv_5",
      mapping: {}
    };

    const parsed = parseChatGptConversation(raw);

    expect(parsed.title).toBe("Untitled conversation");
  });

  it("produces a readable body and correct messageCount", () => {
    const raw: ChatGptExportConversation = {
      conversation_id: "conv_6",
      title: "Chat",
      create_time: 1700000000,
      update_time: 1700000100,
      default_model_slug: "gpt-5",
      mapping: {
        a: textMessage("user", "hi there", 100),
        b: textMessage("assistant", "hello!", 200)
      }
    };

    const parsed = parseChatGptConversation(raw);

    expect(parsed.messageCount).toBe(2);
    expect(parsed.body).toBe("[user] hi there\n\n[assistant] hello!");
    expect(parsed.model).toBe("gpt-5");
    expect(parsed.createdAt).toBe(new Date(1700000000 * 1000).toISOString());
  });
});
