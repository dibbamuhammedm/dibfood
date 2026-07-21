import {
    createHash,
    randomBytes
} from "node:crypto";

/* -------------------------------------------------------------------------- */
/* Session security settings                                                  */
/* -------------------------------------------------------------------------- */

// This name will identify the login cookie in the browser.
export const SESSION_COOKIE_NAME = "dibfood_session";

// Keep a user logged in for seven days.
export const SESSION_DURATION_MS =
    7 * 24 * 60 * 60 * 1000;

// Generate 32 unpredictable random bytes for every new login.
const SESSION_TOKEN_BYTES = 32;

// Create the secret value that will be sent to the browser.
function createSessionToken() {
    return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

// Protect the token before storing it in the database.
function hashSessionToken(token) {
    return createHash("sha256")
        .update(token)
        .digest();
}

/* -------------------------------------------------------------------------- */
/* Session operations                                                         */
/* -------------------------------------------------------------------------- */

// Build session operations using the supplied database repository.
export function createSessionService(sessionRepository) {
    // Create a new login session for one successfully authenticated user.
    function createForUser(userId) {
        const token = createSessionToken();
        const tokenHash = hashSessionToken(token);
        const expiresAt = Date.now() + SESSION_DURATION_MS;

        // Save only the protected token in the database.
        sessionRepository.createSession({
            userId,
            tokenHash,
            expiresAt
        });

        // The route needs the secret token so it can place it in a cookie.
        return {
            token,
            expiresAt
        };
    }

    // Find the user connected to a token received from the browser.
    function findUserByToken(token) {
        // Missing or invalid cookie values cannot represent a session.
        if (typeof token !== "string" || token.length === 0) {
            return null;
        }

        // Hash the browser's token so it can be compared with the database.
        const tokenHash = hashSessionToken(token);

        return sessionRepository.findUserByTokenHash(
            tokenHash,
            Date.now()
        );
    }

    // End the login session represented by a browser cookie.
    function deleteByToken(token) {
        // There is nothing to delete when no valid token was provided.
        if (typeof token !== "string" || token.length === 0) {
            return false;
        }

        // Convert the secret cookie token into its stored database form.
        const tokenHash = hashSessionToken(token);

        return sessionRepository.deleteSessionByTokenHash(tokenHash);
    }

    return {
        createForUser,
        deleteByToken,
        findUserByToken
    };
}