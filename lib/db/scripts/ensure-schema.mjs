import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to initialize the database schema");
}

function normalizePostgresConnectionString(value) {
  const schemeEnd = value.indexOf("://");
  if (schemeEnd < 0) return value;

  const credentialsStart = schemeEnd + 3;
  const atIndex = value.lastIndexOf("@");
  if (atIndex <= credentialsStart) return value;

  const credentials = value.slice(credentialsStart, atIndex);
  const separator = credentials.indexOf(":");
  if (separator < 0) return value;

  const username = credentials.slice(0, separator);
  const rawPassword = credentials.slice(separator + 1);
  let decodedPassword = rawPassword;
  try {
    decodedPassword = decodeURIComponent(rawPassword);
  } catch {
    // Keep malformed percent sequences intact before encoding them below.
  }

  return `${value.slice(0, credentialsStart)}${username}:${encodeURIComponent(decodedPassword)}${value.slice(atIndex)}`;
}

const pool = new Pool({
  connectionString: normalizePostgresConnectionString(process.env.DATABASE_URL),
  connectionTimeoutMillis: 15_000,
  max: 1,
});

const normalizedConnectionString = normalizePostgresConnectionString(process.env.DATABASE_URL);
const connectionUrl = new URL(normalizedConnectionString);
console.log(
  `Database target: user=${connectionUrl.username} host=${connectionUrl.hostname} port=${connectionUrl.port || "5432"}`,
);

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nickname TEXT,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    total_keys INTEGER NOT NULL DEFAULT 0,
    total_potential REAL NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_nickname_idx
    ON user_profiles(nickname)`,
  `CREATE TABLE IF NOT EXISTS user_states (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS completed_techniques (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    technique_id TEXT NOT NULL,
    app_day TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    keys_awarded INTEGER NOT NULL DEFAULT 0,
    potential_awarded REAL NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS completed_techniques_user_idempotency_idx
    ON completed_techniques(user_id, idempotency_key)`,
  `CREATE TABLE IF NOT EXISTS key_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    related_entity_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS potential_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    related_entity_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS streak_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    streak_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS streak_history_user_date_idx
    ON streak_history(user_id, date)`,
  `CREATE TABLE IF NOT EXISTS legacy_migrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    migration_key TEXT NOT NULL,
    source_state JSONB NOT NULL,
    audit JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'imported',
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS legacy_migrations_user_idx
    ON legacy_migrations(user_id)`,
];

const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const statement of statements) {
    await client.query(statement);
  }
  await client.query("COMMIT");
  console.log(`Database schema ready (${statements.length} idempotent statements)`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  client.release();
  await pool.end();
}