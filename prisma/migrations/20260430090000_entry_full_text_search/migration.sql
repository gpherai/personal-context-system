CREATE INDEX "Entry_full_text_search_idx"
ON "Entry"
USING GIN (
  to_tsvector(
    'simple',
    coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("body", '')
  )
);
