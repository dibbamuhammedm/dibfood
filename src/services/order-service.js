import { OrderRequestError } from "../errors.js";

function rollbackOrderTransaction(database) {
  if (!database.isTransaction) {
    return;
  }

  try {
    database.exec("ROLLBACK");
  } catch (rollbackError) {
    // Preserve the original failure while recording a rare rollback problem.
    console.error("Could not roll back order transaction:", rollbackError);
  }
}

export function createOrderService({
  database,
  repositories,
  currency,
  deliveryFeeBututs
}) {
  return function createOrder(orderInput) {
    try {
      // This lock keeps menu prices stable while all related rows are saved.
      database.exec("BEGIN IMMEDIATE");

      const pricedItems = [];
      let subtotalBututs = 0;

      for (const requestedItem of orderInput.items) {
        const menuItem = repositories.getMenuItemById(
          requestedItem.menuItemId
        );

        if (!menuItem) {
          throw new OrderRequestError(400, {
            message: "Please correct the submitted order.",
            errors: {
              items: `Menu item ${requestedItem.menuItemId} does not exist.`
            }
          });
        }

        if (!Boolean(menuItem.available)) {
          throw new OrderRequestError(409, {
            message: `${menuItem.name} is currently unavailable.`
          });
        }

        const lineTotalBututs =
          menuItem.price_bututs * requestedItem.quantity;

        subtotalBututs += lineTotalBututs;
        pricedItems.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          unitPriceBututs: menuItem.price_bututs,
          quantity: requestedItem.quantity,
          lineTotalBututs
        });
      }

      const totalBututs = subtotalBututs + deliveryFeeBututs;
      const orderResult = repositories.saveOrder({
        ...orderInput,
        subtotalBututs,
        deliveryFeeBututs,
        totalBututs
      });
      const orderId = Number(orderResult.lastInsertRowid);

      for (const item of pricedItems) {
        repositories.saveOrderItem(orderId, item);
      }

      // Finish building the receipt before committing the completed transaction.
      const order = {
        id: orderId,
        status: "pending",
        currency,
        subtotal: subtotalBututs / 100,
        deliveryFee: deliveryFeeBututs / 100,
        total: totalBututs / 100,
        items: pricedItems.map((item) => {
          return {
            menuItemId: item.menuItemId,
            name: item.name,
            unitPrice: item.unitPriceBututs / 100,
            quantity: item.quantity,
            lineTotal: item.lineTotalBututs / 100
          };
        })
      };

      database.exec("COMMIT");
      return order;
    } catch (error) {
      // This also rolls back known missing/unavailable-product errors.
      rollbackOrderTransaction(database);
      throw error;
    }
  };
}
