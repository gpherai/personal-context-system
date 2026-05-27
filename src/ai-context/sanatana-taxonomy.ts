import { sanitizeInline } from "./context-mirror";
import type { ContextMirrorFile, MirrorBuildContext } from "./context-mirror";

export function sanatanaTaxonomyExtension({ themes, generatedAtIso }: MirrorBuildContext): ContextMirrorFile[] {
  const deities = themes.filter((t) => t.metadata?.category === "deity");
  const traditions = themes.filter((t) => t.metadata?.category === "tradition");
  const topics = themes.filter((t) => t.metadata?.category === "topic");

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
                const aliases = Array.isArray(t.metadata?.aliases)
                  ? ` [${(t.metadata.aliases as string[]).map((a) => sanitizeInline(a)).join(", ")}]`
                  : "";
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
