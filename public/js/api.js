/* -------------------------------------------------------------------------- */
/* API requests                                                               */
/* -------------------------------------------------------------------------- */

// Keeping endpoint paths here prevents feature files from repeating them.
// Keeping endpoint paths here prevents feature files from repeating them.
const endpoints = {
    contact: "/api/contact",
    currentUser: "/api/auth/me",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    menu: "/api/menu",
    orders: "/api/orders",
    register: "/api/auth/register"
};

// Return parsed JSON or a friendly error when a server sends another format.
async function readJsonResponse(response, fallbackMessage) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("json")) {
        throw new Error(fallbackMessage);
    }

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error(fallbackMessage);
    }

    if (!result || typeof result !== "object") {
        throw new Error(fallbackMessage);
    }

    return result;
}

// Prefer field-specific API errors, then a general message, then our fallback.
function getResponseErrorMessage(result, fallbackMessage) {
    if (result.errors && typeof result.errors === "object") {
        const fieldErrors = Object.values(result.errors)
            .filter((value) => typeof value === "string" && value.length > 0);

        if (fieldErrors.length > 0) {
            return fieldErrors.join(" ");
        }
    }

    if (typeof result.message === "string" && result.message.length > 0) {
        return result.message;
    }

    return fallbackMessage;
}

// Fetch one endpoint and apply the same response checks to every API feature.
async function requestJson(endpoint, options, fallbackMessage) {
    let response;

    try {
        response = await fetch(endpoint, options);
    } catch {
        // Convert browser/network failures into the feature's friendly message.
        throw new Error(fallbackMessage);
    }

    const result = await readJsonResponse(response, fallbackMessage);

    if (!response.ok) {
        throw new Error(getResponseErrorMessage(result, fallbackMessage));
    }

    return result;
}

// Request the menu shown on the home page.
export function getMenu(fallbackMessage) {
    return requestJson(endpoints.menu, undefined, fallbackMessage);
}

// Send cart and delivery details to the order endpoint.
export function createOrder(orderRequest, fallbackMessage) {
    return requestJson(
        endpoints.orders, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(orderRequest)
        },
        fallbackMessage
    );
}

// Send a visitor's contact message to the backend.
export function sendContactMessage(contactMessage, fallbackMessage) {
    return requestJson(
        endpoints.contact, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(contactMessage)
        },
        fallbackMessage
    );
}

// Send login credentials and allow the browser to store the session cookie.
export function loginUser(credentials, fallbackMessage) {
    return requestJson(
        endpoints.login, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },

            // Include same-site cookies in authentication requests.
            credentials: "same-origin",
            body: JSON.stringify(credentials)
        },
        fallbackMessage
    );
}

// Ask the server which user owns the browser's current session.
export function getCurrentUser(fallbackMessage) {
    return requestJson(
        endpoints.currentUser, {
            credentials: "same-origin"
        },
        fallbackMessage
    );
}

// End the server session and remove the browser's login cookie.
export function logoutUser(fallbackMessage) {
    return requestJson(
        endpoints.logout, {
            method: "POST",
            credentials: "same-origin"
        },
        fallbackMessage
    );
}

// Send a new customer's account details to the registration endpoint.
export function registerUser(
    account,
    fallbackMessage = "Your account could not be created. Please try again."
) {
    return requestJson(
        endpoints.register, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify(account)
        },
        fallbackMessage
    );
}