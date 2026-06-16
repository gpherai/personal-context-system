import { parseThemeMetadata } from "@/domain/context";

import { sanitizeInline } from "./context-mirror";
import type { ContextMirrorFile, MirrorBuildContext } from "./context-mirror";

export function sanatanaTaxonomyExtension({ themes, generatedAtIso }: MirrorBuildContext): ContextMirrorFile[] {
  const deities = themes.filter((t) => parseThemeMetadata(t.metadata).category === "deity");
  const traditions = themes.filter((t) => parseThemeMetadata(t.metadata).category === "tradition");
  const topics = themes.filter((t) => parseThemeMetadata(t.metadata).category === "topic");

  if (!deities.length && !traditions.length && !topics.length) return [];

  return [
    {
      path: "sanatana/taxonomy.md",
      contents: [
        "# Sanatana Taxonomie",
        "",
        `Generated: ${generatedAtIso}`,
        "",
        "## Tradities",
        "",
        traditions.length
          ? traditions.map((t) => `- ${sanitizeInline(t.name)} (${t.slug})`).join("\n")
          : "- Geen",
        "",
        "## Godheden",
        "",
        deities.length
          ? deities
              .map((t) => {
                const themeAliases = parseThemeMetadata(t.metadata).aliases;
                const aliases = themeAliases.length ? ` [${themeAliases.map((a) => sanitizeInline(a)).join(", ")}]` : "";
                return `- ${sanitizeInline(t.name)}${aliases} (${t.slug})`;
              })
              .join("\n")
          : "- Geen",
        "",
        "## Onderwerpen",
        "",
        topics.length
          ? topics.map((t) => `- ${sanitizeInline(t.name)} (${t.slug})`).join("\n")
          : "- Geen",
        ""
      ].join("\n")
    }
  ];
}
