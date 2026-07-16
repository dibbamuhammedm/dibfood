import express from "express";
import database from "./database.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10kb" }));

const selectMenuItems = database.prepare(`
  SELECT
    id,
    name,
    price_bututs,
    image,
    available
  FROM menu_items
  ORDER BY id
`);

const insertContactMessage = database.prepare(`
  INSERT INTO contact_messages (
    name,
    email,
    message
  )
  VALUES (?, ?, ?)
`);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.get("/api/health", (_request, response) => {
    response.json({ message: "DibFood API is running" });
});

app.get("/api/menu", (_request, response) => {
    const rows = selectMenuItems.all();

    const menuItems = rows.map((row) => {
        return {
            id: row.id,
            name: row.name,
            price: row.price_bututs / 100,
            image: row.image,
            available: Boolean(row.available)
        };
    });

    response.json({
        currency: "GMD",
        count: menuItems.length,
        items: menuItems
    });
});

app.post("/api/contact", (request, response) => {
    const body = request.body || {};

    const name =
        typeof body.name === "string" ? body.name.trim() : "";

    const email =
        typeof body.email === "string" ? body.email.trim() : "";

    const message =
        typeof body.message === "string" ? body.message.trim() : "";

    const errors = {};

    if (name.length < 2 || name.length > 100) {
        errors.name = "Name must contain between 2 and 100 characters.";
    }

    if (
        email.length < 3 ||
        email.length > 254 ||
        !EMAIL_PATTERN.test(email)
    ) {
        errors.email = "Enter a valid email address.";
    }

    if (message.length < 1 || message.length > 2000) {
        errors.message = "Message must contain between 1 and 2000 characters.";
    }

    if (Object.keys(errors).length > 0) {
        return response.status(400).json({
            message: "Please correct the submitted fields.",
            errors
        });
    }

    const result = insertContactMessage.run(name, email, message);

    return response.status(201).json({
        message: "Thanks! Your message has been received.",
        id: Number(result.lastInsertRowid)
    });
});

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`DibFood is running at http://localhost:${PORT}`);
});