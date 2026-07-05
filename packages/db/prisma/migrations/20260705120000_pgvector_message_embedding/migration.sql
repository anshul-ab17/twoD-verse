-- pgvector for semantic search (plan §13). Requires the pgvector/pgvector image.
CREATE EXTENSION IF NOT EXISTS vector;

-- voyage-3.5 embeddings, dim 1024; null = not yet embedded (lazy write + backfill)
ALTER TABLE "WorldMessage" ADD COLUMN "embedding" vector(1024);

-- ponytail: no ANN index — exact scan is fine at current row counts; add
-- HNSW (CREATE INDEX ... USING hnsw (embedding vector_cosine_ops)) when
-- WorldMessage passes ~50k rows.
