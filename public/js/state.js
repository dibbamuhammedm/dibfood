/* -------------------------------------------------------------------------- */
/* Shared home-page state                                                     */
/* -------------------------------------------------------------------------- */

// Stores the quantity selected for each menu item.
export const cart = new Map();

// Stores complete menu items so the cart can find their names and prices.
export const menuItemsById = new Map();

// These flags prevent duplicate requests and changes during submission.
let orderIsSubmitting = false;
let contactIsSubmitting = false;

export function isOrderSubmitting() {
    return orderIsSubmitting;
}

export function setOrderIsSubmitting(isSubmitting) {
    orderIsSubmitting = isSubmitting;
}

export function isContactSubmitting() {
    return contactIsSubmitting;
}

export function setContactIsSubmitting(isSubmitting) {
    contactIsSubmitting = isSubmitting;
}

// Use GMD until the menu API confirms which currency to display.
let priceFormatter = new Intl.NumberFormat("en-GM", {
    style: "currency",
    currency: "GMD",
    maximumFractionDigits: 0
});

// Replace the formatter when the backend supplies the menu currency.
export function setMenuCurrency(currency) {
    priceFormatter = new Intl.NumberFormat("en-GM", {
        style: "currency",
        currency,
        maximumFractionDigits: 0
    });
}

// Give every feature one consistent way to display prices.
export function formatPrice(amount) {
    return priceFormatter.format(amount);
}
