const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString });

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      author TEXT NOT NULL,
      text TEXT NOT NULL,
      environment TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const countResult = await pool.query("SELECT COUNT(*)::int AS count FROM messages");
  const count = countResult.rows[0]?.count ?? 0;

  if (count === 0) {
    await pool.query(
      `
        INSERT INTO messages (author, text, environment)
        VALUES ($1, $2, $3)
      `,
      ["system", "seeded from backend bootstrap", process.env.APP_ENV || "unknown"]
    );
  }
}

async function listMessages() {
  const result = await pool.query(`
    SELECT id, author, text, environment, created_at
    FROM messages
    ORDER BY id DESC
    LIMIT 20
  `);

  return result.rows;
}

async function insertMessage(author, text) {
  const result = await pool.query(
    `
      INSERT INTO messages (author, text, environment)
      VALUES ($1, $2, $3)
      RETURNING id, author, text, environment, created_at
    `,
    [author, text, process.env.APP_ENV || "unknown"]
  );

  return result.rows[0];
}

async function healthcheck() {
  await pool.query("SELECT 1");
}

module.exports = {
  ensureSchema,
  healthcheck,
  insertMessage,
  listMessages,
  pool,
};

