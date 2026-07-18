import { describe, expect, it } from "vitest";

import { chatGptProjectName, parseChatGptConversation, type ChatGptExportConversation } from "./chatgpt-export";

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

  it("follows the active path via current_node + parent, dropping abandoned regeneration branches", () => {
    const raw: ChatGptExportConversation = {
      conversation_id: "conv_branch",
      title: "Branch",
      current_node: "kept",
      mapping: {
        root: { message: null, parent: undefined },
        user_msg: { ...textMessage("user", "question", 100), parent: "root" },
        abandoned: { ...textMessage("assistant", "regenerated away", 200), parent: "user_msg" },
        kept: { ...textMessage("assistant", "final answer", 300), parent: "user_msg" }
      }
    };

    const parsed = parseChatGptConversation(raw);

    expect(parsed.messages.map((m) => m.text)).toEqual(["question", "final answer"]);
  });

  it("falls back to a full mapping scan when current_node is missing or invalid", () => {
    const raw: ChatGptExportConversation = {
      conversation_id: "conv_missing_current",
      title: "No current_node",
      current_node: "does-not-exist",
      mapping: {
        second: { ...textMessage("assistant", "second reply", 200), parent: "first" },
        first: { ...textMessage("user", "first message", 100), parent: undefined }
      }
    };

    const parsed = parseChatGptConversation(raw);

    expect(parsed.messages.map((m) => m.text)).toEqual(["first message", "second reply"]);
  });

  it("assigns a message id, model, and extracted urls per message", () => {
    const raw: ChatGptExportConversation = {
      conversation_id: "conv_ids",
      title: "IDs",
      mapping: {
        a: {
          message: {
            id: "msg-abc",
            author: { role: "assistant" },
            content: { content_type: "text", parts: ["see this"] },
            create_time: 100,
            metadata: {
              model_slug: "gpt-5-2",
              content_references: [
                {
                  type: "sources_footnote",
                  sources: [{ url: "https://example.com/a" }, { url: "https://example.com/b" }]
                }
              ]
            }
          }
        }
      }
    };

    const parsed = parseChatGptConversation(raw);

    expect(parsed.messages[0].id).toBe("msg-abc");
    expect(parsed.messages[0].model).toBe("gpt-5-2");
    expect(parsed.messages[0].urls.sort()).toEqual(["https://example.com/a", "https://example.com/b"]);
    expect(parsed.models).toEqual(["gpt-5-2"]);
  });

  it("carries conversation-level flags and derived stats", () => {
    const raw: ChatGptExportConversation = {
      conversation_id: "conv_flags",
      title: "Flags",
      is_archived: true,
      is_starred: true,
      is_study_mode: true,
      pinned_time: 1700000000,
      mapping: {
        a: textMessage("user", "hi", 100)
      }
    };

    const parsed = parseChatGptConversation(raw);

    expect(parsed.isArchived).toBe(true);
    expect(parsed.isStarred).toBe(true);
    expect(parsed.isStudyMode).toBe(true);
    expect(parsed.pinnedTime).toBe(new Date(1700000000 * 1000).toISOString());
    expect(parsed.charCount).toBe("hi".length);
  });

  it("carries the ChatGPT project id from conversation_template_id, when present", () => {
    const withProject: ChatGptExportConversation = {
      conversation_id: "conv_project",
      title: "In a project",
      conversation_template_id: "g-p-67adc80836648191886e73d3e10d6ec6",
      mapping: { a: textMessage("user", "hi", 100) }
    };
    const withoutProject: ChatGptExportConversation = {
      conversation_id: "conv_no_project",
      title: "No project",
      mapping: { a: textMessage("user", "hi", 100) }
    };

    expect(parseChatGptConversation(withProject).projectId).toBe("g-p-67adc80836648191886e73d3e10d6ec6");
    expect(parseChatGptConversation(withoutProject).projectId).toBeUndefined();
  });
});

describe("chatGptProjectName", () => {
  it("resolves a known projectId to its manually mapped name", () => {
    expect(chatGptProjectName("g-p-67adc74960788191af52e0a12985148c")).toBe("🕉️Pathik");
  });

  it("returns undefined for an unknown or missing projectId", () => {
    expect(chatGptProjectName("g-p-does-not-exist")).toBeUndefined();
    expect(chatGptProjectName(undefined)).toBeUndefined();
  });
});
