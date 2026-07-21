import { SESSION_COOKIE_NAME } from "../services/session-service.js";

/* -------------------------------------------------------------------------- */
/* Session cookie helpers                                                     */
/* -------------------------------------------------------------------------- */

// Send a login-session cookie to the user's browser.
export function setSessionCookie(response, session) {
    response.cookie(
        SESSION_COOKIE_NAME,
        session.token, {
            // Browser JavaScript cannot read this cookie.
            httpOnly: true,

            // Send the cookie to every page and API route on this website.
            path: "/",

            // Reduce the risk of another website submitting the cookie.
            sameSite: "lax",

            // HTTPS is required in production, but localhost can still use HTTP.
            secure: process.env.NODE_ENV === "production",

            // The browser removes the cookie when the server session expires.
            expires: new Date(session.expiresAt)
        }
    );
}
// Read the login token sent in the browser's Cookie header.
export function readSessionToken(request) {
    const cookieHeader = request.headers.cookie;

    // A visitor without cookies is not currently logged in.
    if (typeof cookieHeader !== "string") {
        return null;
    }

    const cookiePrefix = `${SESSION_COOKIE_NAME}=`;

    // Cookie headers contain multiple values separated by semicolons.
    const sessionCookie = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(cookiePrefix));

    if (!sessionCookie) {
        return null;
    }

    // Remove "dibfood_session=" and return only its token value.
    const token = sessionCookie.slice(cookiePrefix.length);

    return token || null;
}

// Tell the browser to remove its DibFood login cookie.
export function clearSessionCookie(response) {
    response.clearCookie(
        SESSION_COOKIE_NAME, {
            // Match the security settings used when creating the cookie.
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        }
    );
}