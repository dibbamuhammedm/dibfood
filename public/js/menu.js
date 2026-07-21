import { getMenu } from "./api.js";
import { addMenuItemToCart, renderCart } from "./cart.js";
import { menuGrid } from "./dom.js";
import {
    formatPrice,
    isOrderSubmitting,
    menuItemsById,
    setMenuCurrency
} from "./state.js";

/* -------------------------------------------------------------------------- */
/* Menu                                                                       */
/* -------------------------------------------------------------------------- */

// Fetch the current menu and turn each API item into a visible card.
async function loadMenu() {
    const fallbackMessage = "The menu could not be loaded.";

    try {
        const menuData = await getMenu(fallbackMessage);

        if (!Array.isArray(menuData.items)) {
            throw new Error(fallbackMessage);
        }

        setMenuCurrency(menuData.currency);
        menuItemsById.clear();
        menuGrid.replaceChildren();

        for (const item of menuData.items) {
            menuItemsById.set(item.id, item);

            const menuCard = document.createElement("article");
            menuCard.className = "menu-item";

            const image = document.createElement("img");
            image.src = item.image;
            image.alt = item.name;
            image.loading = "lazy";

            const name = document.createElement("h3");
            name.textContent = item.name;

            const price = document.createElement("p");
            price.className = "price";
            price.textContent = formatPrice(item.price);

            const actions = document.createElement("div");
            actions.className = "menu-actions";

            const cartButton = document.createElement("button");
            cartButton.type = "button";
            cartButton.className = "btn btn-primary";
            cartButton.textContent = item.available ?
                "Add to Cart" :
                "Unavailable";
            cartButton.disabled = isOrderSubmitting() || !item.available;
            cartButton.dataset.action = "add-to-cart";
            cartButton.dataset.itemId = item.id;

            actions.append(cartButton);
            menuCard.append(image, name, price, actions);
            menuGrid.append(menuCard);
        }

        // Reformat the subtotal with the API-confirmed currency.
        renderCart();
    } catch (error) {
        console.error("Could not load menu:", error);

        const errorMessage = document.createElement("p");
        errorMessage.textContent = fallbackMessage;
        menuGrid.replaceChildren(errorMessage);
    }
}

// Event delegation handles Add to Cart buttons created after the API request.
function handleMenuClick(event) {
    const cartButton = event.target.closest(
        'button[data-action="add-to-cart"]'
    );

    if (!cartButton) {
        return;
    }

    addMenuItemToCart(Number(cartButton.dataset.itemId));
}

export function initializeMenu() {
    menuGrid.addEventListener("click", handleMenuClick);
    loadMenu();
}
