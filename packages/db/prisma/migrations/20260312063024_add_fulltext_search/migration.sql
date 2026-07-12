-- Enable trigram extension for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add generated tsvector column for full-text search on email
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(email, ''))) STORED;

-- GIN index for full-text search (fast @@ queries)
CREATE INDEX IF NOT EXISTS users_search_vector_idx ON "User" USING gin(search_vector);

-- Trigram index for fast ILIKE / partial matching
CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON "User" USING gin(email gin_trgm_ops);