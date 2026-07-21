# DibFood

DibFood is a small food-delivery web application built with Express, browser JavaScript, and SQLite. Customers can browse the menu, manage a cart, place an order, and send a contact message.

## Setup and run

Install [Node.js 24 or newer](https://nodejs.org/), then run these commands from the project folder:

```powershell
npm install
npm run seed
npm start
```

Open <http://localhost:3000> in a browser.

The seed command adds or updates the four starter menu items and is safe to run again. For development, use `npm run dev` to restart the server automatically when backend files change.

## Project structure

- `server.js` is the small entry point that starts the configured Express app.
- `database.js` opens the configured SQLite database for scripts such as `seed.js`.
- `src/app.js` assembles the middleware, API router, and static website.
- `src/config.js` contains shared paths and business settings.
- `src/database/` contains the SQLite connection and table schema.
- `src/data/repositories.js` contains prepared SQL statements and data access.
- `src/routes/api-router.js` maps HTTP endpoints to application operations.
- `src/services/order-service.js` prices and stores an order transactionally.
- `src/validation.js` validates contact and checkout request bodies.
- `src/middleware/error-handler.js` returns safe JSON parser errors.
- `seed.js` adds or updates the starter menu data.
- `public/css/` separates shared, home-page, and login-page styles.
- `public/js/` separates API calls, state, DOM references, menu, cart, checkout, contact, and startup code.
- `public/login.html` remains a visual login page until we build authentication.

## API

- `GET /api/health` checks that the Express server is running.
- `GET /api/menu` returns the current menu and prices.
- `POST /api/contact` accepts `name`, `email`, and `message` as JSON.
- `POST /api/orders` accepts delivery details and cart items as JSON.

An order request has this shape:

```json
{
  "customerName": "Awa Jallow",
  "phone": "+220 123 4567",
  "city": "bundung",
  "address": "House 10, Main Road",
  "items": [
    {
      "menuItemId": 1,
      "quantity": 2
    }
  ]
}
```

The server reads current product prices from SQLite and calculates the final totals; it does not trust prices supplied by the browser.

## Database

Local data is stored in `data/dibfood.db`. The file is created automatically and is intentionally excluded from Git because it can contain customer messages and orders. Running `npm run seed` updates starter products without deleting existing orders or messages.

## Manual test checklist

Run the automated backend smoke tests first:

```powershell
npm test
```

The tests use a temporary SQLite database and do not change `data/dibfood.db`.
Then complete these browser checks:

- Confirm the home page and four seeded menu items load.
- Add food to the cart and test increase, decrease, and Remove.
- Place a valid order and confirm its number and server-calculated total appear.
- Try invalid checkout details and confirm a useful error appears without clearing the cart.
- Send a valid contact message and confirm the success message appears.
- Check the home and login layouts on wide and narrow screens.

## Current scope

The ordering and contact flows are implemented. Login, password recovery, and account creation are visual-only placeholders for future authentication work.
