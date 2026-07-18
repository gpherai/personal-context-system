-- Switch Source FTS from 'simple' (no stemming) to 'dutch' (stemming) to match
-- the mostly-Dutch content of imported ChatGPT conversations. 'dutch' still
-- matches literal English tokens (just without English-specific stemming).
DROP INDEX IF EXISTS "Source_fts_idx";
CREATE INDEX "Source_fts_idx"
  ON "Source"
  USING GIN (
    to_tsvector('dutch',
      coalesce("title", '') || ' ' ||
      coalesce("body", '')  || ' ' ||
      coalesce("searchText", '')
    )
  );
