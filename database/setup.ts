import pool from "./db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("[DB Setup] Starting database initialization...");

    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    const statements = schema
      .split(";")
      .map(stmt => stmt.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await client.query(statement);
      console.log("[DB Setup] ✓ Executed statement");
    }

    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    console.log("[DB Setup] Tables created:");
    tables.rows.forEach(row => console.log(" -", row.table_name));

  } catch (error) {
    console.error("[DB Setup] Fatal error:", error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

setupDatabase();
