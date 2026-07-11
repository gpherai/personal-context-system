import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";

import { PrismaContextRepository } from "./prisma-context-repository";

describe("PrismaContextRepository.mergeThemes", () => {
  it("reparents child themes onto the target before deleting the source", async () => {
    const calls: string[] = [];

    const tx = {
      entryTheme: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn()
      },
      sourceTheme: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn()
      },
      theme: {
        updateMany: vi.fn().mockImplementation((args: unknown) => {
          calls.push("updateMany");
          return Promise.resolve({ count: 1, args });
        }),
        delete: vi.fn().mockImplementation(() => {
          calls.push("delete");
          return Promise.resolve({});
        }),
        update: vi
          .fn()
          .mockResolvedValue({ id: "target", slug: "target", name: "Target", description: null, _count: { entries: 0 } })
      }
    };

    const prisma = {
      $transaction: (fn: (client: typeof tx) => unknown) => fn(tx)
    } as unknown as PrismaClient;

    const repo = new PrismaContextRepository(prisma);
    const result = await repo.mergeThemes({ sourceThemeId: "source", targetThemeId: "target" });

    expect(tx.theme.updateMany).toHaveBeenCalledWith({
      where: { parentThemeId: "source" },
      data: { parentThemeId: "target" }
    });
    // Reparent must happen before the source theme is deleted.
    expect(calls).toEqual(["updateMany", "delete"]);
    expect(result.id).toBe("target");
  });
});
