export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company VARCHAR(200) NOT NULL,
    role VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Applied', 'Interviewed', 'Rejected')),
    date_applied DATE NOT NULL,
    duties VARCHAR(10000) NOT NULL DEFAULT '',
    address VARCHAR(1000) NOT NULL DEFAULT '',
    contact_email VARCHAR(320) NOT NULL DEFAULT '',
    contact_phone VARCHAR(100) NOT NULL DEFAULT '',
    website VARCHAR(2000) NOT NULL DEFAULT '',
    requirements VARCHAR(10000) NOT NULL DEFAULT '',
    notes VARCHAR(20000) NOT NULL DEFAULT ''
  )`,

  "CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON jobs (user_id)",
]

export async function initializeSchema(pool) {
  for (const statement of schemaStatements) {
    await pool.query(statement)
  }
}
