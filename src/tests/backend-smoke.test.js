import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { createApp } from "../app.js";
import { openDatabase } from "../database/connection.js";

let database;
let server;
let baseUrl;
let temporaryDirectory;

before(async () => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "dibfood-backend-test-"));
  database = openDatabase(join(temporaryDirectory, "test.db"));

  const saveMenuItem = database.prepare(`
    INSERT INTO menu_items (id, name, price_bututs, image, available)
    VALUES (?, ?, ?, ?, ?)
  `);

  saveMenuItem.run(1, "Full Chicken", 20000, "/fullchicken.jpeg", 1);
  saveMenuItem.run(2, "Unavailable Meal", 15000, "/friedfish.avif", 0);
  saveMenuItem.run(3, "Burger", 12000, "/burger.jpeg", 1);

  const app = createApp({ database });
  server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }

  database?.close();

  if (temporaryDirectory?.startsWith(tmpdir())) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("health and menu routes retain their public responses", async () => {
  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), {
    message: "DibFood API is running"
  });

  const menuResponse = await fetch(`${baseUrl}/api/menu`);
  assert.equal(menuResponse.status, 200);
  assert.deepEqual(await menuResponse.json(), {
    currency: "GMD",
    count: 3,
    items: [
      {
        id: 1,
        name: "Full Chicken",
        price: 200,
        image: "/fullchicken.jpeg",
        available: true
      },
      {
        id: 2,
        name: "Unavailable Meal",
        price: 150,
        image: "/friedfish.avif",
        available: false
      },
      {
        id: 3,
        name: "Burger",
        price: 120,
        image: "/burger.jpeg",
        available: true
      }
    ]
  });
});

test("contact validation and storage retain their behavior", async () => {
  const invalidResponse = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "", email: "bad", message: "" })
  });
  assert.equal(invalidResponse.status, 400);
  assert.equal(
    (await invalidResponse.json()).message,
    "Please correct the submitted fields."
  );

  const validResponse = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Test Customer",
      email: "customer@example.com",
      message: "Hello DibFood"
    })
  });
  assert.equal(validResponse.status, 201);
  assert.deepEqual(await validResponse.json(), {
    message: "Thanks! Your message has been received.",
    id: 1
  });
});

test("failed orders roll back and a valid order uses server prices", async () => {
  const unavailableResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      customerName: "Test Customer",
      phone: "+220 123 4567",
      city: "bundung",
      address: "Test address",
      items: [{ menuItemId: 2, quantity: 1 }]
    })
  });
  assert.equal(unavailableResponse.status, 409);
  assert.deepEqual(await unavailableResponse.json(), {
    message: "Unavailable Meal is currently unavailable."
  });
  assert.equal(database.prepare("SELECT count(*) AS count FROM orders").get().count, 0);

  const validResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      customerName: "Test Customer",
      phone: "+220 123 4567",
      city: "bundung",
      address: "Test address",
      items: [
        { menuItemId: 1, quantity: 1 },
        { menuItemId: 3, quantity: 2 }
      ]
    })
  });
  assert.equal(validResponse.status, 201);

  const result = await validResponse.json();
  assert.equal(result.message, "Your order has been created.");
  assert.equal(result.order.currency, "GMD");
  assert.equal(result.order.subtotal, 440);
  assert.equal(result.order.deliveryFee, 0);
  assert.equal(result.order.total, 440);
  assert.equal(result.order.items.length, 2);
  assert.equal(database.prepare("SELECT count(*) AS count FROM orders").get().count, 1);
  assert.equal(database.prepare("SELECT count(*) AS count FROM order_items").get().count, 2);
});

test("JSON parser errors remain JSON responses", async () => {
  const malformedResponse = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  });
  assert.equal(malformedResponse.status, 400);
  assert.deepEqual(await malformedResponse.json(), {
    message: "Request body must contain valid JSON."
  });

  const oversizedResponse = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "x".repeat(11 * 1024) })
  });
  assert.equal(oversizedResponse.status, 413);
  assert.deepEqual(await oversizedResponse.json(), {
    message: "Request body is too large."
  });
});
