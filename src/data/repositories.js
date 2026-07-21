// Prepare recurring SQL once, then expose small data-access functions.
// Placeholder values stay separate from SQL text and cannot become commands.
export function createRepositories(database) {
  const statements = {
    selectMenuItems: database.prepare(`
      SELECT
        id,
        name,
        price_bututs,
        image,
        available
      FROM menu_items
      ORDER BY id
    `),

    insertContactMessage: database.prepare(`
      INSERT INTO contact_messages (
        name,
        email,
        message
      )
      VALUES (?, ?, ?)
    `),

    selectMenuItemById: database.prepare(`
      SELECT
        id,
        name,
        price_bututs,
        available
      FROM menu_items
      WHERE id = ?
    `),

    insertOrder: database.prepare(`
      INSERT INTO orders (
        customer_name,
        phone,
        city,
        address,
        subtotal_bututs,
        delivery_fee_bututs,
        total_bututs
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `),

    insertOrderItem: database.prepare(`
      INSERT INTO order_items (
        order_id,
        menu_item_id,
        item_name,
        unit_price_bututs,
        quantity,
        line_total_bututs
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
  };

  return {
    getMenuItems() {
      return statements.selectMenuItems.all();
    },

    saveContactMessage(contact) {
      return statements.insertContactMessage.run(
        contact.name,
        contact.email,
        contact.message
      );
    },

    getMenuItemById(menuItemId) {
      return statements.selectMenuItemById.get(menuItemId);
    },

    saveOrder(order) {
      return statements.insertOrder.run(
        order.customerName,
        order.phone,
        order.city,
        order.address,
        order.subtotalBututs,
        order.deliveryFeeBututs,
        order.totalBututs
      );
    },

    saveOrderItem(orderId, item) {
      return statements.insertOrderItem.run(
        orderId,
        item.menuItemId,
        item.name,
        item.unitPriceBututs,
        item.quantity,
        item.lineTotalBututs
      );
    }
  };
}
