import { loginUser, registerUser } from "./api.js";

/* -------------------------------------------------------------------------- */
/* Authentication page references                                            */
/* -------------------------------------------------------------------------- */

const authTabs = document.querySelectorAll("[data-auth-view]");
const signInPanel = document.querySelector("#sign-in-panel");
const registerPanel = document.querySelector("#register-panel");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginStatus = document.querySelector("#login-status");
const registerStatus = document.querySelector("#register-status");
const confirmPassword = document.querySelector("#register-confirm-password");

let authIsSubmitting = false;

// Update a live region with a sending, success, or error state.
function setStatus(element, message, state) {
    element.textContent = message;

    if (state) {
        element.dataset.state = state;
    } else {
        delete element.dataset.state;
    }
}

// Switch between panels while keeping tab attributes useful to screen readers.
function showAuthView(viewName, moveFocus = false) {
    const showRegister = viewName === "register";

    signInPanel.hidden = showRegister;
    registerPanel.hidden = !showRegister;

    for (const tab of authTabs) {
        const isSelected = tab.dataset.authView === viewName;
        tab.setAttribute("aria-selected", String(isSelected));
        tab.tabIndex = isSelected ? 0 : -1;
    }

    setStatus(loginStatus, "", null);
    setStatus(registerStatus, "", null);

    if (moveFocus) {
        const activePanel = showRegister ? registerPanel : signInPanel;
        activePanel.querySelector("input").focus();
    }
}

// Disable both forms and tabs while one authentication request is running.
function setAuthSubmitting(form, isSubmitting, pendingLabel, idleLabel) {
    authIsSubmitting = isSubmitting;
    form.setAttribute("aria-busy", String(isSubmitting));

    for (const tab of authTabs) {
        tab.disabled = isSubmitting;
    }

    const fields = form.querySelectorAll("input");

    for (const field of fields) {
        field.disabled = isSubmitting;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? pendingLabel : idleLabel;
}

// Send the sign-in form and redirect after the cookie is created.
async function handleLoginSubmit(event) {
    event.preventDefault();

    if (authIsSubmitting) {
        return;
    }

    const formData = new FormData(loginForm);
    const credentials = {
        email: formData.get("email"),
        password: formData.get("password")
    };

    setAuthSubmitting(loginForm, true, "Signing In...", "Sign In");
    setStatus(loginStatus, "Signing you in...", "sending");

    try {
        const result = await loginUser(
            credentials,
            "You could not be signed in. Please try again."
        );
        setStatus(loginStatus, result.message, "success");

        // Keep the form locked while the browser moves to the home page.
        window.location.assign("/");
    } catch (error) {
        setStatus(loginStatus, error.message, "error");
        setAuthSubmitting(loginForm, false, "Signing In...", "Sign In");
    }
}

// Validate matching passwords, then let the backend validate account rules.
async function handleRegisterSubmit(event) {
    event.preventDefault();

    if (authIsSubmitting) {
        return;
    }

    const formData = new FormData(registerForm);
    const password = formData.get("password");
    const passwordConfirmation = formData.get("confirmPassword");

    if (password !== passwordConfirmation) {
        confirmPassword.setAttribute("aria-invalid", "true");
        setStatus(registerStatus, "The passwords do not match.", "error");
        confirmPassword.focus();
        return;
    }

    const account = {
        name: formData.get("name"),
        email: formData.get("email"),
        password
    };

    setAuthSubmitting(
        registerForm,
        true,
        "Creating Account...",
        "Create Account"
    );
    setStatus(registerStatus, "Creating your account...", "sending");

    try {
        const result = await registerUser(
            account,
            "Your account could not be created. Please try again."
        );
        // Registration creates the account but does not log it in.
        setAuthSubmitting(
            registerForm,
            false,
            "Creating Account...",
            "Create Account"
        );
        registerForm.reset();

        // Return to Sign In after the account is created.
        showAuthView("login");

        const loginEmail = loginForm.querySelector(
            'input[name="email"]'
        );
        const loginPassword = loginForm.querySelector(
            'input[name="password"]'
        );

        // Preserve the new account's email and explain the next action.
        loginEmail.value = account.email;
        setStatus(
            loginStatus,
            `${result.message} Please sign in.`,
            "success"
        );
        loginPassword.focus();
    } catch (error) {
        setStatus(registerStatus, error.message, "error");
        setAuthSubmitting(
            registerForm,
            false,
            "Creating Account...",
            "Create Account"
        );
    }
}

// Tab buttons change views without navigating away from the page.
for (const tab of authTabs) {
    tab.addEventListener("click", () => {
        if (!authIsSubmitting) {
            showAuthView(tab.dataset.authView, true);
        }
    });
}

// Remove the error marker as soon as the visitor edits the confirmation.
confirmPassword.addEventListener("input", () => {
    confirmPassword.removeAttribute("aria-invalid");
});

loginForm.addEventListener("submit", handleLoginSubmit);
registerForm.addEventListener("submit", handleRegisterSubmit);

// A #register link can open account creation directly; sign-in is the default.
showAuthView(window.location.hash === "#register" ? "register" : "login");