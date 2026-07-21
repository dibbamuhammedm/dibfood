import { sendContactMessage } from "./api.js";
import {
    contactForm,
    contactStatus,
    contactSubmit
} from "./dom.js";
import {
    isContactSubmitting,
    setContactIsSubmitting
} from "./state.js";

/* -------------------------------------------------------------------------- */
/* Contact                                                                    */
/* -------------------------------------------------------------------------- */

async function handleContactSubmit(event) {
    event.preventDefault();

    if (isContactSubmitting()) {
        return;
    }

    const formData = new FormData(contactForm);
    const contactMessage = {
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message")
    };

    setContactIsSubmitting(true);
    contactSubmit.disabled = true;
    contactForm.setAttribute("aria-busy", "true");
    contactStatus.textContent = "Sending...";
    contactStatus.dataset.state = "sending";

    const fallbackMessage =
        "The message could not be sent. Please try again.";

    try {
        const result = await sendContactMessage(
            contactMessage,
            fallbackMessage
        );

        contactStatus.textContent = result.message;
        contactStatus.dataset.state = "success";
        contactForm.reset();
    } catch (error) {
        contactStatus.textContent = error.message || fallbackMessage;
        contactStatus.dataset.state = "error";
    } finally {
        setContactIsSubmitting(false);
        contactSubmit.disabled = false;
        contactForm.setAttribute("aria-busy", "false");
    }
}

export function initializeContact() {
    contactForm.addEventListener("submit", handleContactSubmit);
}
