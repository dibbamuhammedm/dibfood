import express from "express";
import { config } from "./config.js";
import { createRepositories } from "./data/repositories.js";
import { createUserRepository } from "./data/user-repository.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createApiRouter } from "./routes/api-router.js";
import { createAuthRouter } from "./routes/auth-router.js";
import { createAuthService } from "./services/auth-service.js";
import { createOrderService } from "./services/order-service.js";
import { createSessionRepository } from "./data/session-repository.js";
import { createSessionService } from "./services/session-service.js";



// Assemble the application from focused modules. Accepting a database makes the
// same app testable with a disposable SQLite file.
export function createApp({
    database,
    publicDirectory = config.publicDirectory
}) {
    const app = express();
    const repositories = createRepositories(database);


    const createOrder = createOrderService({
        database,
        repositories,
        currency: config.currency,
        deliveryFeeBututs: config.deliveryFeeBututs
    });

    // Parse JSON bodies while rejecting unusually large API payloads.
    app.use(express.json({ limit: "10kb" }));

    // Give the authentication service access to user database operations.
    const userRepository = createUserRepository(database);
    const authService = createAuthService(userRepository);

    // Connect session security operations to their database repository.
    const sessionRepository = createSessionRepository(database);
    const sessionService = createSessionService(sessionRepository);

    // Every route in authRouter begins with /api/auth.
    app.use(
        "/api/auth",
        createAuthRouter(authService, sessionService)
    );

    app.use("/api", createApiRouter({
        repositories,
        createOrder,
        currency: config.currency,
        serviceAreas: config.serviceAreas
    }));

    // This absolute path works regardless of which folder starts the server.
    app.use(express.static(publicDirectory));

    app.use(errorHandler);

    return app;
}