import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "../../migrations");

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log("Checking migration history table...");

    // Create tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get already applied migrations
    const { rows: appliedRows } = await client.query(
      "SELECT name FROM schema_migrations ORDER BY id ASC",
    );
    const appliedNames = new Set(appliedRows.map((r) => r.name));

    // Read all .sql files in migrations directory
    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations directory found.");
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const pendingFiles = files.filter((file) => !appliedNames.has(file));

    if (pendingFiles.length === 0) {
      console.log(" All migrations are already up to date.");
      return;
    }

    console.log(`Found ${pendingFiles.length} pending migration(s)...`);

    for (const file of pendingFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`Applying migration: ${file}...`);
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (name) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");
      console.log(` Applied: ${file}`);
    }

    console.log("All migrations applied successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(" Migration failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();

