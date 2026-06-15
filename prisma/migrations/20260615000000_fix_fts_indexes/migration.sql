-- Drop duplicate Entry GIN index (identical to Entry_fts_idx created in 20260526)
DROP INDEX IF EXISTS "Entry_full_text_search_idx";

-- Fix Source FTS index: was title||searchText, query uses title||body||searchText
DROP INDEX IF EXISTS "Source_fts_idx";
CREATE INDEX "Source_fts_idx"
  ON "Source"
  USING GIN (
    to_tsvector('simple',
      coalesce("title", '') || ' ' ||
      coalesce("body", '')  || ' ' ||
      coalesce("searchText", '')
    )
  );
