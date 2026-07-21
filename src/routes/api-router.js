import { Router } from "express";
import { OrderRequestError } from "../errors.js";
import {
  hasErrors,
  validateContactRequest,
  validateOrderRequest
} from "../validation.js";

export function createApiRouter({
  repositories,
  createOrder,
  currency,
  serviceAreas
}) {
  const router = Router();

  // This liveness check proves Express is reachable; it does not query SQLite.
  router.get("/health", (_request, response) => {
    response.json({ message: "DibFood API is running" });
  });

  router.get("/menu", (_request, response) => {
    const rows = repositories.getMenuItems();
    const menuItems = rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        // Convert bututs and SQLite's 1/0 flag into browser-friendly values.
        price: row.price_bututs / 100,
        image: row.image,
        available: Boolean(row.available)
      };
    });

    response.json({
      currency,
      count: menuItems.length,
      items: menuItems
    });
  });

  router.post("/contact", (request, response) => {
    const validation = validateContactRequest(request.body);

    if (hasErrors(validation.errors)) {
      return response.status(400).json({
        message: "Please correct the submitted fields.",
        errors: validation.errors
      });
    }

    const result = repositories.saveContactMessage(validation.value);

    return response.status(201).json({
      message: "Thanks! Your message has been received.",
      id: Number(result.lastInsertRowid)
    });
  });

  router.post("/orders", (request, response) => {
    const validation = validateOrderRequest(request.body, serviceAreas);

    if (hasErrors(validation.errors)) {
      return response.status(400).json({
        message: "Please correct the submitted order.",
        errors: validation.errors
      });
    }

    try {
      const order = createOrder(validation.value);

      return response.status(201).json({
        message: "Your order has been created.",
        order
      });
    } catch (error) {
      if (error instanceof OrderRequestError) {
        return response.status(error.statusCode).json(error.responseBody);
      }

      console.error("Could not create order:", error);

      return response.status(500).json({
        message: "The order could not be created."
      });
    }
  });

  return router;
}
