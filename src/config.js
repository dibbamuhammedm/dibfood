import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve project paths from this file instead of the terminal's current folder.
const projectDirectory = fileURLToPath(new URL("../", import.meta.url));
const defaultDatabasePath = fileURLToPath(
  new URL("../data/dibfood.db", import.meta.url)
);

// A custom path lets tests use a disposable database without touching real data.
const configuredDatabasePath = process.env.DIBFOOD_DATABASE_PATH;

export const config = {
  port: process.env.PORT || 3000,
  publicDirectory: fileURLToPath(new URL("../public/", import.meta.url)),
  databasePath: configuredDatabasePath
    ? resolve(projectDirectory, configuredDatabasePath)
    : defaultDatabasePath,
  currency: "GMD",
  deliveryFeeBututs: 0,
  serviceAreas: new Set([
    "bundung",
    "serekunda",
    "latrikunda",
    "talinding"
  ])
};
