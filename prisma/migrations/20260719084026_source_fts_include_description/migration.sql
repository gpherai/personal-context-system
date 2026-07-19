-- Include "description" in Source FTS: it's rendered on the sources list
-- (SourceCard) but was never searchable — title/body/searchText only.
DROP INDEX IF EXISTS "Source_fts_idx";
CREATE INDEX "Source_fts_idx"
  ON "Source"
  USING GIN (
    to_tsvector('dutch',
      coalesce("title", '')       || ' ' ||
      coalesce("description", '') || ' ' ||
      coalesce("body", '')        || ' ' ||
      coalesce("searchText", '')
    )
  );
