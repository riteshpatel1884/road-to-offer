import { sql } from '@vercel/postgres';

// One-row table holding the entire tracker state as JSON.
// Keeping this dead simple: id is always 1, data is the full `days` array.

export async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;
}

export async function getProgress() {
  await ensureTable();
  const { rows } = await sql`SELECT data FROM progress WHERE id = 1;`;
  if (rows.length === 0) return null;
  return rows[0].data;
}

export async function setProgress(data) {
  await ensureTable();
  await sql`
    INSERT INTO progress (id, data, updated_at)
    VALUES (1, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (id)
    DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, updated_at = now();
  `;
}
