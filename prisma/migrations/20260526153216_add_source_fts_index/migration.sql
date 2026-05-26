-- GIN index voor Entry FTS (title + summary + body)
CREATE INDEX IF NOT EXISTS "Entry_fts_idx"
  ON "Entry"
  USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("body", '')));

-- GIN index voor Source FTS (title + searchText)
CREATE INDEX IF NOT EXISTS "Source_fts_idx"
  ON "Source"
  USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("searchText", '')));