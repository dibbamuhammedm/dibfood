// Create every table required by the current application.
// CREATE TABLE IF NOT EXISTS preserves all existing records.
export function ensureSchema(database) {
    database.exec(`
    -- Foreign-key enforcement must be enabled for each SQLite connection.
    PRAGMA foreign_keys = ON;

    -- The menu catalog. Money is stored as whole bututs (D1 = 100 bututs).
    -- SQLite uses 1 and 0 for the available flag because it has no Boolean type.
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price_bututs INTEGER NOT NULL CHECK (price_bututs >= 0),
      image TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1))
    ) STRICT;

    -- Messages submitted through the contact form. CURRENT_TIMESTAMP is UTC.
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

    -- One parent record for a checkout, including server-calculated totals.
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,

      customer_name TEXT NOT NULL
        CHECK (length(trim(customer_name)) BETWEEN 2 AND 100),

      phone TEXT NOT NULL
        CHECK (length(trim(phone)) BETWEEN 7 AND 30),

      city TEXT NOT NULL
        CHECK (length(trim(city)) BETWEEN 2 AND 100),

      address TEXT NOT NULL
        CHECK (length(trim(address)) BETWEEN 2 AND 200),

      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
          status IN (
            'pending',
            'confirmed',
            'preparing',
            'out_for_delivery',
            'delivered',
            'cancelled'
          )
        ),

      subtotal_bututs INTEGER NOT NULL
        CHECK (subtotal_bututs >= 0),

      delivery_fee_bututs INTEGER NOT NULL DEFAULT 0
        CHECK (delivery_fee_bututs >= 0),

      total_bututs INTEGER NOT NULL
        CHECK (
          total_bututs = subtotal_bututs + delivery_fee_bututs
        ),

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;

    -- Each row is one product line belonging to an order.
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY,

      order_id INTEGER NOT NULL,

      -- Nullable so deleting a menu product preserves the historical order line.
      menu_item_id INTEGER,

      -- These snapshots keep old receipts accurate after menu names or prices change.
      item_name TEXT NOT NULL
        CHECK (length(trim(item_name)) BETWEEN 1 AND 100),

      unit_price_bututs INTEGER NOT NULL
        CHECK (unit_price_bututs >= 0),

      quantity INTEGER NOT NULL
        CHECK (quantity BETWEEN 1 AND 99),

      line_total_bututs INTEGER NOT NULL
        CHECK (
          line_total_bututs = unit_price_bututs * quantity
        ),

      UNIQUE (order_id, menu_item_id),

      -- Removing an order also removes all of its product lines.
      FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

      -- Removing a menu product keeps the line but clears its live menu link.
      FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(id)
        ON DELETE SET NULL
    ) STRICT;

        -- Registered customer accounts used for registration and login.
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,

      name TEXT NOT NULL
        CHECK (length(trim(name)) BETWEEN 2 AND 100),

      -- NOCASE makes Test@Email.com and test@email.com the same account.
      email TEXT NOT NULL COLLATE NOCASE UNIQUE
        CHECK (length(email) BETWEEN 3 AND 254),

      -- Store only the protected password result, never the raw password.
      password_hash BLOB NOT NULL,

      -- Each account receives a unique random salt before password hashing.
      password_salt BLOB NOT NULL,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;
         -- A session remembers a successful login across browser requests.
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY,

      -- The account that owns this session.
      user_id INTEGER NOT NULL,

      -- Store a protected token instead of the secret cookie value.
      token_hash BLOB NOT NULL UNIQUE
        CHECK (length(token_hash) = 32),

      -- Unix time in milliseconds when this login stops being valid.
      expires_at INTEGER NOT NULL,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      -- Deleting an account also removes all of its login sessions.
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    ) STRICT;
  `);
}