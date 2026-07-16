async function loadMenu() {
    const menuGrid = document.querySelector("#menu-grid");

    try {
        const response = await fetch("/api/menu");

        if (!response.ok) {
            throw new Error(`Menu request failed: ${response.status}`);
        }

        const menuData = await response.json();

        menuGrid.replaceChildren();

        const priceFormatter = new Intl.NumberFormat("en-GM", {
            style: "currency",
            currency: menuData.currency,
            maximumFractionDigits: 0
        });

        for (const item of menuData.items) {
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
            price.textContent = priceFormatter.format(item.price);

            const actions = document.createElement("div");
            actions.className = "menu-actions";

            const detailsButton = document.createElement("button");
            detailsButton.type = "button";
            detailsButton.className = "btn btn-outline";
            detailsButton.textContent = "Details";
            detailsButton.dataset.itemId = item.id;

            const cartButton = document.createElement("button");
            cartButton.type = "button";
            cartButton.className = "btn btn-primary";
            cartButton.textContent = item.available ? "Add to Cart" : "Unavailable";
            cartButton.disabled = !item.available;
            cartButton.dataset.itemId = item.id;

            actions.append(detailsButton, cartButton);
            menuCard.append(image, name, price, actions);
            menuGrid.append(menuCard);
        }
    } catch (error) {
        console.error("Could not load menu:", error);

        const errorMessage = document.createElement("p");
        errorMessage.textContent = "The menu could not be loaded.";

        menuGrid.replaceChildren(errorMessage);
    }
}

loadMenu();

const contactForm = document.querySelector("#contact-form");
const contactSubmit = document.querySelector("#contact-submit");
const contactStatus = document.querySelector("#contact-status");

contactForm.addEventListener("submit", async(event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);

    const contactMessage = {
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message")
    };

    contactSubmit.disabled = true;
    contactStatus.textContent = "Sending...";
    contactStatus.dataset.state = "sending";

    try {
        const response = await fetch("/api/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(contactMessage)
        });

        const result = await response.json();

        if (!response.ok) {
            const errorMessage = result.errors ?
                Object.values(result.errors).join(" ") :
                result.message;

            throw new Error(errorMessage || "The message could not be sent.");
        }

        contactStatus.textContent = result.message;
        contactStatus.dataset.state = "success";
        contactForm.reset();
    } catch (error) {
        contactStatus.textContent = error.message;
        contactStatus.dataset.state = "error";
    } finally {
        contactSubmit.disabled = false;
    }
});