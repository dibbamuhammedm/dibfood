import { createOrder } from "./api.js";
import { renderCart, updateCartControls } from "./cart.js";
import {
    checkoutForm,
    orderStatus,
    placeOrderButton
} from "./dom.js";
import {
    cart,
    formatPrice,
    isOrderSubmitting,
    setOrderIsSubmitting
} from "./state.js";

/* -------------------------------------------------------------------------- */
/* Checkout                                                                   */
/* -------------------------------------------------------------------------- */

// Lock both the UI and event handlers while one order request is in flight.
function setOrderSubmitting(isSubmitting) {
    setOrderIsSubmitting(isSubmitting);
    checkoutForm.setAttribute("aria-busy", String(isSubmitting));
    placeOrderButton.textContent = isSubmitting ?
        "Placing Order..." :
        "Place Order";

    const checkoutFields = checkoutForm.querySelectorAll(
        "input, select, textarea"
    );

    for (const field of checkoutFields) {
        field.disabled = isSubmitting;
    }

    updateCartControls();
}

async function handleCheckoutSubmit(event) {
    event.preventDefault();

    if (isOrderSubmitting()) {
        return;
    }

    if (cart.size === 0) {
        orderStatus.textContent = "Please add food to your cart first.";
        orderStatus.dataset.state = "error";
        return;
    }

    const formData = new FormData(checkoutForm);
    const items = Array.from(
        cart,
        ([menuItemId, quantity]) => ({ menuItemId, quantity })
    );

    // Prices are intentionally omitted; the backend calculates trusted totals.
    const orderRequest = {
        customerName: formData.get("customerName"),
        phone: formData.get("phone"),
        city: formData.get("city"),
        address: formData.get("address"),
        items
    };

    setOrderSubmitting(true);
    orderStatus.textContent = "Sending your order...";
    orderStatus.dataset.state = "sending";

    const fallbackMessage =
        "Your order could not be created. Please try again.";

    try {
        const result = await createOrder(orderRequest, fallbackMessage);

        orderStatus.textContent =
            `${result.message} Order #${result.order.id}. ` +
            `Total: ${formatPrice(result.order.total)}.`;
        orderStatus.dataset.state = "success";

        checkoutForm.reset();
        cart.clear();
        renderCart();
    } catch (error) {
        orderStatus.textContent = error.message || fallbackMessage;
        orderStatus.dataset.state = "error";
    } finally {
        setOrderSubmitting(false);
    }
}

export function initializeCheckout() {
    checkoutForm.addEventListener("submit", handleCheckoutSubmit);
}
