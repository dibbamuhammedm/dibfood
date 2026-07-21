import { Router } from "express";
import {
    hasErrors,
    validateLoginRequest,
    validateRegistrationRequest
} from "../validation.js";

import {
    clearSessionCookie,
    readSessionToken,
    setSessionCookie
} from "../http/session-cookie.js";


/* -------------------------------------------------------------------------- */
/* Authentication routes                                                      */
/* -------------------------------------------------------------------------- */

// Build authentication endpoints using the supplied service.
export function createAuthRouter(authService, sessionService) {
    const router = Router();

    // Create a new customer account.
    router.post("/register", async(request, response) => {
        const validation = validateRegistrationRequest(request.body);

        if (hasErrors(validation.errors)) {
            return response.status(400).json({
                message: "Please correct the submitted account details.",
                errors: validation.errors
            });
        }

        // The service protects the password before saving the account.
        const user = await authService.register(validation.value);

        if (!user) {
            return response.status(409).json({
                message: "An account with that email already exists."
            });
        }

        return response.status(201).json({
            message: "Your account has been created.",
            user
        });
    });

    // Check whether the submitted email and password are correct.
    router.post("/login", async(request, response) => {
        const validation = validateLoginRequest(request.body);

        // A 400 response means the submitted fields have an invalid format.
        if (hasErrors(validation.errors)) {
            return response.status(400).json({
                message: "Please correct the submitted login details.",
                errors: validation.errors
            });
        }

        const user = await authService.login(validation.value);

        // Use one general message so we do not reveal which emails exist.
        if (!user) {
            return response.status(401).json({
                message: "Email or password is incorrect."
            });
        }

        // Remember this successful login with a new server-side session.
        const session = sessionService.createForUser(user.id);

        // Send the secret session token to the browser as a protected cookie.
        setSessionCookie(response, session);

        // Only safe, public user information is returned.
        return response.status(200).json({
            message: "Login successful.",
            user
        });
    });

    // Return the account belonging to the browser's active session.
    router.get("/me", (request, response) => {
        const token = readSessionToken(request);
        const user = sessionService.findUserByToken(token);

        // Missing, unknown, and expired sessions are all unauthenticated.
        if (!user) {
            return response.status(401).json({
                message: "You are not logged in."
            });
        }

        // Return only the public account information.
        return response.status(200).json({
            user
        });
    });

    // End the current browser's login session.
    router.post("/logout", (request, response) => {
        const token = readSessionToken(request);

        // Remove the server-side session when a cookie was provided.
        sessionService.deleteByToken(token);

        // Remove the browser cookie even if it was missing or already invalid.
        clearSessionCookie(response);

        return response.status(200).json({
            message: "You have been logged out."
        });
    });

    return router;
}