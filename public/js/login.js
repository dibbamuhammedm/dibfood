import { loginUser } from "./api.js";

/* -------------------------------------------------------------------------- */
/* Login-page initialization                                                  */
/* -------------------------------------------------------------------------- */

// Find the login form by its unique HTML id.
const loginForm = document.querySelector("#login-form");
// This paragraph displays progress, success, and error messages.
const loginStatus = document.querySelector("#login-status");

// Run this function when the button is clicked or Enter is pressed.
loginForm.addEventListener("submit", async(event) => {
    // Stop the browser from reloading the page and submitting normally.
    event.preventDefault();

    // FormData reads inputs using their HTML name attributes.
    const formData = new FormData(loginForm);

    // Build the object that we will eventually send to the backend.
    const credentials = {
        email: formData.get("email"),
        password: formData.get("password")
    };

    // Tell the user that the network request has started.
    loginStatus.textContent = "Signing in...";

    // Find the submit button inside this form.
    const loginButton = loginForm.querySelector(
        'button[type="submit"]'
    );

    // Prevent another submission while the first request is running.
    loginButton.disabled = true;
    loginButton.textContent = "Signing In...";
    loginStatus.dataset.state = "loading";


    try {
        // Wait for the backend to verify the credentials and create a session.
        const result = await loginUser(
            credentials,
            "Unable to sign in right now. Please try again."
        );

        // Display the safe success message returned by the backend.
        loginStatus.textContent = result.message;
        loginStatus.dataset.state = "success";

        // The cookie is stored, so continue to the DibFood home page.
        window.location.assign("/");
    } catch (error) {

        loginStatus.dataset.state = "error";
        // Display validation, credential, or connection errors.
        loginStatus.textContent = error instanceof Error ?
            error.message :
            "Unable to sign in right now. Please try again.";
    } finally {
        // Restore the button after either success or failure.
        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }


});