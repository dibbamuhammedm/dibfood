import { initializeAuthNavigation } from "./auth-nav.js";
import { initializeCart } from "./cart.js";
import { initializeCheckout } from "./checkout.js";
import { initializeContact } from "./contact.js";
import { initializeMenu } from "./menu.js";

/* -------------------------------------------------------------------------- */
/* Home-page initialization                                                   */
/* -------------------------------------------------------------------------- */

// Start each independent feature after the module script loads.
// Check whether this browser already has a valid login session.
initializeAuthNavigation();
initializeCart();
initializeCheckout();
initializeContact();
initializeMenu();