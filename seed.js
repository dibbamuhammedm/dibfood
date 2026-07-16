import database from "./database.js";

const menuItems = [{
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

database.exec("BEGIN");

try {
    for (const item of menuItems) {
        saveMenuItem.run(
            item.id,
            item.name,
            item.priceBututs,
            item.image,
            item.available ? 1 : 0
        );
    }

    database.exec("COMMIT");
    console.log(`Seeded ${menuItems.length} menu items.`);
} catch (error) {
    database.exec("ROLLBACK");
    throw error;
} finally {
    database.close();
}