import { describe, expect, it } from "vitest";

import { parseClaudeCodeSession } from "./claude-code-export";

function userEvent(opts: {
  uuid: string;
  timestamp: string;
  content: unknown;
  isMeta?: boolean;
  isSidechain?: boolean;
  cwd?: string;
}) {
  return {
    type: "user",
    uuid: opts.uuid,
    timestamp: opts.timestamp,
    isMeta: opts.isMeta ?? false,
    isSidechain: opts.isSidechain ?? false,
    cwd: opts.cwd ?? "/home/gerald/projects/demo",
    message: { role: "user", content: opts.content }
  };
}

function assistantEvent(opts: {
  uuid: string;
  timestamp: string;
  content: unknown[];
  model?: string;
  isSidechain?: boolean;
  cwd?: string;
}) {
  return {
    type: "assistant",
    uuid: opts.uuid,
    timestamp: opts.timestamp,
    isSidechain: opts.isSidechain ?? false,
    cwd: opts.cwd ?? "/home/gerald/projects/demo",
    message: { role: "assistant", content: opts.content, model: opts.model ?? "claude-sonnet-5" }
  };
}

function aiTitleEvent(title: string) {
  return { type: "ai-title", aiTitle: title };
}

describe("parseClaudeCodeSession", () => {
  it("keeps human user text and assistant text replies", () => {
    const events = [
      userEvent({ uuid: "u1", timestamp: "2026-07-10T10:00:00.000Z", content: "hallo" }),
      assistantEvent({ uuid: "a1", timestamp: "2026-07-10T10:00:05.000Z", content: [{ type: "text", text: "hoi terug" }] })
    ];

    const parsed = parseClaudeCodeSession("sess-1", events);

    expect(parsed.messages.map((m) => ({ role: m.role, text: m.text }))).toEqual([
      { role: "user", text: "hallo" },
      { role: "assistant", text: "hoi terug" }
    ]);
    expect(parsed.messageCount).toBe(2);
    expect(parsed.body).toBe("[user] hallo\n\n[assistant] hoi terug");
  });

  it("drops tool_result-only user events (not human input)", () => {
    const events = [
      userEvent({
        uuid: "u1",
        timestamp: "2026-07-10T10:00:00.000Z",
        content: [{ type: "tool_result", tool_use_id: "t1", content: "file contents..." }]
      })
    ];

    const parsed = parseClaudeCodeSession("sess-1", events);

    expect(parsed.messages).toEqual([]);
  });

  it("drops isMeta user events even when content is plain text", () => {
    const events = [userEvent({ uuid: "u1", timestamp: "2026-07-10T10:00:00.000Z", content: "hook-injected text", isMeta: true })];

    const parsed = parseClaudeCodeSession("sess-1", events);

    expect(parsed.messages).toEqual([]);
  });

  it("drops sidechain (subagent) events", () => {
    const events = [
      userEvent({ uuid: "u1", timestamp: "2026-07-10T10:00:00.000Z", content: "subagent prompt", isSidechain: true }),
      assistantEvent({ uuid: "a1", timestamp: "2026-07-10T10:00:05.000Z", content: [{ type: "text", text: "subagent reply" }], isSidechain: true })
    ];

    const parsed = parseClaudeCodeSession("sess-1", events);

    expect(parsed.messages).toEqual([]);
  });

  it("strips synthetic wrapper tags and drops the message if nothing real remains", () => {
    const events = [
      userEvent({
        uuid: "u1",
        timestamp: "2026-07-10T10:00:00.000Z",
        content: "<command-name>/clear</command-name>\n            <command-message>clear</command-message>\n            <command-args></command-args>"
      }),
      userEvent({
        uuid: "u2",
        timestamp: "2026-07-10T10:01:00.000Z",
        content: "echte vraag hier\n\n<system-reminder>ignore this injected context</system-reminder>"
      })
    ];

    const parsed = parseClaudeCodeSession("sess-1", events);

    expect(parsed.messages).toHaveLength(1);
    expect(parsed.messages[0].text).toBe("echte vraag hier");
  });

  it("keeps only assistant text blocks, aggregates tool/skill use at session level", () => {
    const events = [
      assistantEvent({
        uuid: "a1",
        timestamp: "2026-07-10T10:00:00.000Z",
        content: [
          { type: "thinking", thinking: "let me check the file" },
          { type: "tool_use", id: "t1", name: "Read", input: { file_path: "/x" } },
          { type: "tool_use", id: "t2", name: "Skill", input: { skill: "verify" } }
        ]
      }),
      assistantEvent({
        uuid: "a2",
        timestamp: "2026-07-10T10:00:10.000Z",
        content: [{ type: "text", text: "hier is het antwoord" }]
      })
    ];

    const parsed = parseClaudeCodeSession("sess-1", events);

    // First event is a pure tool-call/thinking turn: no reply text, so it's not a message
    expect(parsed.messages).toHaveLength(1);
    expect(parsed.messages[0].text).toBe("hier is het antwoord");
    expect(parsed.toolUseCount).toBe(2);
    expect(parsed.toolNames.sort()).toEqual(["Read", "Skill"]);
    expect(parsed.skillsUsed).toEqual(["verify"]);
    expect(parsed.hasThinking).toBe(true);
  });

  it("titles from the last ai-title event, overriding earlier ones", () => {
    const events = [
      userEvent({ uuid: "u1", timestamp: "2026-07-10T10:00:00.000Z", content: "vraag" }),
      aiTitleEvent("Eerste werktitel"),
      assistantEvent({ uuid: "a1", timestamp: "2026-07-10T10:00:05.000Z", content: [{ type: "text", text: "antwoord" }] }),
      aiTitleEvent("Definitieve titel")
    ];

    const parsed = parseClaudeCodeSession("sess-1", events);

    expect(parsed.title).toBe("Definitieve titel");
  });

  it("falls back to the first human message when there is no ai-title event", () => {
    const events = [
      userEvent({ uuid: "u1", timestamp: "2026-07-10T10:00:00.000Z", content: "wat is de status van dit project?" })
    ];

    const parsed = parseClaudeCodeSession("sess-1", events);

    expect(parsed.title).toBe("wat is de status van dit project?");
  });

  it("derives projectDir from cwd and aggregates models across assistant turns", () => {
    const events = [
      userEvent({ uuid: "u1", timestamp: "2026-07-10T10:00:00.000Z", content: "hoi", cwd: "/home/gerald/projects/personal-context-system" }),
      assistantEvent({
        uuid: "a1",
        timestamp: "2026-07-10T10:00:05.000Z",
        content: [{ type: "text", text: "antwoord" }],
        model: "claude-sonnet-5",
        cwd: "/home/gerald/projects/personal-context-system"
      })
    ];

    const parsed = parseClaudeCodeSession("sess-1", events);

    expect(parsed.projectDir).toBe("personal-context-system");
    expect(parsed.models).toEqual(["claude-sonnet-5"]);
    expect(parsed.model).toBe("claude-sonnet-5");
  });

  it("computes createdAt/updatedAt from the full event timestamp range, including dropped events", () => {
    const events = [
      userEvent({ uuid: "u1", timestamp: "2026-07-10T09:00:00.000Z", content: [{ type: "tool_result", content: "noise" }] }),
      userEvent({ uuid: "u2", timestamp: "2026-07-10T10:00:00.000Z", content: "vraag" }),
      assistantEvent({ uuid: "a1", timestamp: "2026-07-10T11:30:00.000Z", content: [{ type: "text", text: "antwoord" }] })
    ];

    const parsed = parseClaudeCodeSession("sess-1", events);

    expect(parsed.createdAt).toBe("2026-07-10T09:00:00.000Z");
    expect(parsed.updatedAt).toBe("2026-07-10T11:30:00.000Z");
  });

  it("handles an empty session", () => {
    const parsed = parseClaudeCodeSession("sess-empty", []);

    expect(parsed.messages).toEqual([]);
    expect(parsed.messageCount).toBe(0);
    expect(parsed.title).toBe("Untitled session");
    expect(parsed.rawEventCount).toBe(0);
  });
});
