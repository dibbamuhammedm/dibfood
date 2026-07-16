import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync("data/dibfood.db");

database.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price_bututs INTEGER NOT NULL CHECK (price_bututs >= 0),
    image TEXT NOT NULL,
    available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1))
  ) STRICT;

    CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
      CHECK (length(trim(name)) BETWEEN 2 AND 100),
    email TEXT NOT NULL
      CHECK (length(email) BETWEEN 3 AND 254),
    message TEXT NOT NULL
      CHECK (length(trim(message)) BETWEEN 1 AND 2000),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) STRICT;
   `);

export default database;