const { ensureSchema, pool } = require("../db");

async function main() {
  await ensureSchema();
  await pool.end();
  console.log("schema migration completed");
}

main().catch(async (error) => {
  console.error(error);
  await pool.end().catch(() => {});
  process.exit(1);
});

