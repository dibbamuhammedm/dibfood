import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ensureSchema } from "./schema.js";

// Open one SQLite file and make sure its parent folder and schema exist.
export function openDatabase(databasePath) {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  ensureSchema(database);

  return database;
}
