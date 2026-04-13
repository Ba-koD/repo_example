const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString });

async function healthcheck() {
  await pool.query("SELECT 1");
}

async function readDatabaseTime() {
  const result = await pool.query(
    "select now() as database_time, current_database() as database_name"
  );
  return result.rows[0];
}

module.exports = {
  healthcheck,
  readDatabaseTime,
  pool,
};
