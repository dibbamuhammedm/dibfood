// Importing database.js opens SQLite and ensures the schema exists first.
import database from "./database.js";

// Starter data for local development. Prices use bututs, so D200 is 20,000.
const menuItems = [
    {
        id: 1,
        name: "Full Chicken",
        priceBututs: 20000,
        image: "/fullchicken.jpeg",
        available: true
    },
    {
        id: 2,
        name: "Fried Fish",
        priceBututs: 15000,
        image: "/friedfish.avif",
        available: true
    },
    {
        id: 3,
        name: "Burger",
        priceBututs: 12000,
        image: "/burger.jpeg",
        available: true
    },
    {
        id: 4,
        name: "Pizza",
        priceBututs: 25000,
        image: "/pizza.jpeg",
        available: true
    }
];

// Upsert makes this script repeatable: existing IDs are updated instead of duplicated.
// In SQLite, "excluded" means the incoming row that conflicted with an existing ID.
const saveMenuItem = database.prepare(`
  INSERT INTO menu_items (
    id,
    name,
    price_bututs,
    image,
    available
  )
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    price_bututs = excluded.price_bututs,
    image = excluded.image,
    available = excluded.available
`);

try {
    // One transaction saves every starter item or none of them.
    database.exec("BEGIN");

    for (const item of menuItems) {
        saveMenuItem.run(
            item.id,
            item.name,
            item.priceBututs,
            item.image,
            // SQLite stores this Boolean as the integer 1 or 0.
            item.available ? 1 : 0
        );
    }

    database.exec("COMMIT");
    console.log(`Upserted ${menuItems.length} menu items.`);
} catch (error) {
    // BEGIN can fail, so only roll back when a transaction actually started.
    if (database.isTransaction) {
        database.exec("ROLLBACK");
    }

    throw error;
} finally {
    // Always release the file connection, whether seeding succeeded or failed.
    database.close();
}
