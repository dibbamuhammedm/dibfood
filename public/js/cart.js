import {
    cartCount,
    cartItemsContainer,
    cartSubtotal,
    menuGrid,
    orderStatus,
    placeOrderButton
} from "./dom.js";
import {
    cart,
    formatPrice,
    isOrderSubmitting,
    menuItemsById
} from "./state.js";

/* -------------------------------------------------------------------------- */
/* Cart                                                                       */
/* -------------------------------------------------------------------------- */

const maximumItemQuantity = 99;

// Remove an old order result when the customer starts changing the cart again.
function clearOrderStatus() {
    orderStatus.textContent = "";
    delete orderStatus.dataset.state;
}

function getCartQuantity() {
    let totalQuantity = 0;

    for (const quantity of cart.values()) {
        totalQuantity += quantity;
    }

    return totalQuantity;
}

// Keep all cart-related buttons synchronized with cart and submission state.
export function updateCartControls() {
    const totalQuantity = getCartQuantity();
    const orderIsSubmitting = isOrderSubmitting();

    cartCount.textContent = totalQuantity;
    placeOrderButton.disabled = orderIsSubmitting || totalQuantity === 0;

    const menuButtons = menuGrid.querySelectorAll(
        'button[data-action="add-to-cart"]'
    );

    for (const button of menuButtons) {
        const item = menuItemsById.get(Number(button.dataset.itemId));
        button.disabled = orderIsSubmitting || !item || !item.available;
    }

    const cartButtons = cartItemsContainer.querySelectorAll(
        "button[data-cart-action]"
    );

    for (const button of cartButtons) {
        const menuItemId = Number(button.dataset.itemId);
        const quantity = cart.get(menuItemId) || 0;
        const reachedMaximum =
            button.dataset.cartAction === "increase" &&
            quantity >= maximumItemQuantity;

        button.disabled = orderIsSubmitting || reachedMaximum;
    }
}

// Create a cart control with the data and label needed by one shared listener.
function createCartButton({
    action,
    item,
    label,
    accessibleLabel,
    className = "cart-control-button"
}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.dataset.cartAction = action;
    button.dataset.itemId = item.id;
    button.setAttribute("aria-label", accessibleLabel);
    button.disabled = isOrderSubmitting();
    return button;
}

// Rebuild the visible cart from the quantities stored in the Map.
export function renderCart() {
    cartItemsContainer.replaceChildren();
    let subtotal = 0;

    if (cart.size === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "Your cart is empty.";

        cartItemsContainer.append(emptyMessage);
        cartSubtotal.textContent = formatPrice(0);
        updateCartControls();
        return;
    }

    for (const [menuItemId, quantity] of cart) {
        const item = menuItemsById.get(menuItemId);

        if (!item) {
            continue;
        }

        const lineTotal = item.price * quantity;
        subtotal += lineTotal;

        const cartItem = document.createElement("article");
        cartItem.className = "cart-item";

        const itemName = document.createElement("h3");
        itemName.textContent = item.name;

        const itemSummary = document.createElement("p");
        itemSummary.textContent =
            `${quantity} × ${formatPrice(item.price)} = ` +
            formatPrice(lineTotal);

        const cartActions = document.createElement("div");
        cartActions.className = "cart-item-actions";

        const decreaseButton = createCartButton({
            action: "decrease",
            item,
            label: "−",
            accessibleLabel: `Decrease the quantity of ${item.name}`
        });

        const quantityDisplay = document.createElement("span");
        quantityDisplay.className = "cart-quantity";
        quantityDisplay.textContent = quantity;

        const increaseButton = createCartButton({
            action: "increase",
            item,
            label: "+",
            accessibleLabel: `Increase the quantity of ${item.name}`
        });
        increaseButton.disabled =
            isOrderSubmitting() || quantity >= maximumItemQuantity;

        const removeButton = createCartButton({
            action: "remove",
            item,
            label: "Remove",
            accessibleLabel: `Remove ${item.name} from the cart`,
            className: "cart-remove-button"
        });

        cartActions.append(
            decreaseButton,
            quantityDisplay,
            increaseButton,
            removeButton
        );

        cartItem.append(itemName, itemSummary, cartActions);
        cartItemsContainer.append(cartItem);
    }

    cartSubtotal.textContent = formatPrice(subtotal);
    updateCartControls();
}

// Add one item selected from a generated menu card.
export function addMenuItemToCart(menuItemId) {
    if (isOrderSubmitting()) {
        return;
    }

    const item = menuItemsById.get(menuItemId);
    const currentQuantity = cart.get(menuItemId) || 0;

    if (
        !item ||
        !item.available ||
        currentQuantity >= maximumItemQuantity
    ) {
        return;
    }

    clearOrderStatus();
    cart.set(menuItemId, currentQuantity + 1);
    renderCart();
}

// Event delegation handles every generated increase, decrease, and remove button.
function handleCartClick(event) {
    const controlButton = event.target.closest(
        "button[data-cart-action]"
    );

    if (!controlButton || isOrderSubmitting()) {
        return;
    }

    const menuItemId = Number(controlButton.dataset.itemId);
    const action = controlButton.dataset.cartAction;
    const currentQuantity = cart.get(menuItemId);

    if (!currentQuantity) {
        return;
    }

    let cartChanged = false;

    if (action === "increase" && currentQuantity < maximumItemQuantity) {
        cart.set(menuItemId, currentQuantity + 1);
        cartChanged = true;
    }

    if (action === "decrease") {
        if (currentQuantity === 1) {
            cart.delete(menuItemId);
        } else {
            cart.set(menuItemId, currentQuantity - 1);
        }

        cartChanged = true;
    }

    if (action === "remove") {
        cart.delete(menuItemId);
        cartChanged = true;
    }

    if (cartChanged) {
        clearOrderStatus();
        renderCart();
    }
}

export function initializeCart() {
    cartItemsContainer.addEventListener("click", handleCartClick);
    renderCart();
}
