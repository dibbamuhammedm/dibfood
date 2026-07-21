const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,30}$/;

// Request bodies are untrusted, so first reduce them to plain usable values.
function normalizeBody(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return {};
    }

    return body;
}

function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
}

export function hasErrors(errors) {
    return Object.keys(errors).length > 0;
}

export function validateContactRequest(body) {
    const input = normalizeBody(body);
    const value = {
        name: normalizeText(input.name),
        email: normalizeText(input.email),
        message: normalizeText(input.message)
    };
    const errors = {};

    if (value.name.length < 2 || value.name.length > 100) {
        errors.name = "Name must contain between 2 and 100 characters.";
    }

    if (
        value.email.length < 3 ||
        value.email.length > 254 ||
        !EMAIL_PATTERN.test(value.email)
    ) {
        errors.email = "Enter a valid email address.";
    }

    if (value.message.length < 1 || value.message.length > 2000) {
        errors.message = "Message must contain between 1 and 2000 characters.";
    }

    return { errors, value };
}

// Return clean order values and field errors without writing to the database.
export function validateOrderRequest(body, serviceAreas) {
    const input = normalizeBody(body);
    const customerName = normalizeText(input.customerName);
    const phone = normalizeText(input.phone);
    const city = normalizeText(input.city).toLowerCase();
    const address = normalizeText(input.address);
    const errors = {};
    const phoneDigitCount = phone.replace(/\D/g, "").length;

    if (customerName.length < 2 || customerName.length > 100) {
        errors.customerName =
            "Customer name must contain between 2 and 100 characters.";
    }

    // Formatting characters are allowed, but a phone must contain 7-15 digits.
    if (!PHONE_PATTERN.test(phone) ||
        phoneDigitCount < 7 ||
        phoneDigitCount > 15
    ) {
        errors.phone = "Enter a valid phone number.";
    }

    if (!serviceAreas.has(city)) {
        errors.city = "Select a supported delivery area.";
    }

    if (address.length < 2 || address.length > 200) {
        errors.address = "Address must contain between 2 and 200 characters.";
    }

    // Each cart entry must refer to one unique product with a sensible quantity.
    const items = [];
    const seenMenuItemIds = new Set();

    if (!Array.isArray(input.items) ||
        input.items.length < 1 ||
        input.items.length > 20
    ) {
        errors.items =
            "An order must contain between 1 and 20 different menu items.";
    } else {
        for (let index = 0; index < input.items.length; index += 1) {
            const requestedItem = input.items[index];

            if (!requestedItem || typeof requestedItem !== "object") {
                errors.items = `Item ${index + 1} is invalid.`;
                break;
            }

            const menuItemId = requestedItem.menuItemId;
            const quantity = requestedItem.quantity;

            if (!Number.isInteger(menuItemId) || menuItemId < 1) {
                errors.items = `Item ${index + 1} has an invalid menu ID.`;
                break;
            }

            if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
                errors.items =
                    `Item ${index + 1} must have a quantity between 1 and 99.`;
                break;
            }

            if (seenMenuItemIds.has(menuItemId)) {
                errors.items =
                    "Each menu item may appear only once; increase its quantity instead.";
                break;
            }

            seenMenuItemIds.add(menuItemId);
            items.push({ menuItemId, quantity });
        }
    }

    return {
        errors,
        value: {
            customerName,
            phone,
            city,
            address,
            items
        }
    };
}

// Clean and validate the email and password submitted during login.
export function validateLoginRequest(body) {
    const input = normalizeBody(body);

    const value = {
        // Emails are trimmed and normalized so casing does not affect login.
        email: normalizeText(input.email).toLowerCase(),

        // Do not trim passwords because spaces may intentionally be part of one.
        password: typeof input.password === "string" ?
            input.password : ""
    };

    const errors = {};

    if (
        value.email.length < 3 ||
        value.email.length > 254 ||
        !EMAIL_PATTERN.test(value.email)
    ) {
        errors.email = "Enter a valid email address.";
    }

    // Array.from counts complete characters more accurately than .length.
    const passwordLength = Array.from(value.password).length;

    if (passwordLength < 8 || passwordLength > 128) {
        errors.password =
            "Password must contain between 8 and 128 characters.";
    }

    return {
        errors,
        value
    };
}

// Validate the additional name required when creating an account.
export function validateRegistrationRequest(body) {
    const input = normalizeBody(body);

    // Registration uses the same email and password rules as login.
    const loginValidation = validateLoginRequest(input);

    const value = {
        name: normalizeText(input.name),
        email: loginValidation.value.email,
        password: loginValidation.value.password
    };

    // Copy login errors so we can safely add a name error.
    const errors = {
        ...loginValidation.errors
    };

    if (value.name.length < 2 || value.name.length > 100) {
        errors.name =
            "Name must contain between 2 and 100 characters.";
    }

    return {
        errors,
        value
    };
}