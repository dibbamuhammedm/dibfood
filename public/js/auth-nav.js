import {
    getCurrentUser,
    logoutUser
} from "./api.js";

import {
    authUser,
    loginLink,
    logoutButton
} from "./dom.js";

/* -------------------------------------------------------------------------- */
/* Authentication navigation                                                  */
/* -------------------------------------------------------------------------- */

// Display the controls used by visitors who are not logged in.
function showLoggedOut() {
    authUser.textContent = "";
    authUser.hidden = true;
    loginLink.hidden = false;
    logoutButton.hidden = true;
}

// Display the current customer's name and logout button.
function showLoggedIn(user) {
    authUser.textContent = `Hi, ${user.name}`;
    authUser.hidden = false;
    loginLink.hidden = true;
    logoutButton.hidden = false;
}

// End the current session when the user presses Logout.
async function handleLogout() {
    logoutButton.disabled = true;

    try {
        await logoutUser(
            "Unable to log out right now. Please try again."
        );

        showLoggedOut();
    } catch (error) {
        // Keep the user controls visible so logout can be tried again.
        authUser.textContent = error instanceof Error ?
            error.message :
            "Unable to log out right now. Please try again.";
        authUser.hidden = false;
    } finally {
        logoutButton.disabled = false;
    }
}

// Check the existing cookie when the home page loads.
export async function initializeAuthNavigation() {
    // Logged-out mode is the safe default while the request runs.
    showLoggedOut();

    logoutButton.addEventListener("click", handleLogout);

    try {
        const result = await getCurrentUser(
            "Unable to check the current login."
        );

        showLoggedIn(result.user);
    } catch {
        // A missing, expired, or invalid session displays the Login link.
        showLoggedOut();
    }
}