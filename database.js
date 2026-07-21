import { config } from "./src/config.js";
import { openDatabase } from "./src/database/connection.js";

// Keep this default export so existing files such as seed.js need no changes.
// Importing it opens SQLite and creates any missing application tables.
const database = openDatabase(config.databasePath);

export default database;
