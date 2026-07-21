import { promisify } from "node:util";

import {
    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual
} from "node:crypto";

/* -------------------------------------------------------------------------- */
/* Password protection                                                        */
/* -------------------------------------------------------------------------- */

// Convert Node's callback-based scrypt function into one we can await.
const scrypt = promisify(scryptCallback);

// Produce a 64-byte protected result for each password.
const PASSWORD_HASH_BYTES = 64;

// Generate a different 16-byte salt for every customer account.
const PASSWORD_SALT_BYTES = 16;

// Use fixed-length placeholders when an email does not exist.
const DUMMY_PASSWORD_SALT = Buffer.alloc(PASSWORD_SALT_BYTES);
const DUMMY_PASSWORD_HASH = Buffer.alloc(PASSWORD_HASH_BYTES);

// Use Node's cryptographically secure random generator, not Math.random().
function createPasswordSalt() {
    return randomBytes(PASSWORD_SALT_BYTES);
}

// Transform a password using its unique salt.
async function derivePasswordHash(password, salt) {
    return scrypt(password, salt, PASSWORD_HASH_BYTES);
}

// Compare a submitted password with the protected database value.
async function passwordMatches(password, storedHash, storedSalt) {
    const submittedHash = Buffer.from(
        await derivePasswordHash(password, storedSalt)
    );

    const expectedHash = Buffer.from(storedHash);

    // timingSafeEqual requires buffers with identical lengths.
    return (
        expectedHash.length === submittedHash.length &&
        timingSafeEqual(expectedHash, submittedHash)
    );
}

/* -------------------------------------------------------------------------- */
/* Authentication operations                                                  */
/* -------------------------------------------------------------------------- */

// Build authentication functions using the supplied user repository.
export function createAuthService(userRepository) {
    // Protect the password before sending account data to SQLite.
    async function register(account) {
        const passwordSalt = createPasswordSalt();
        const passwordHash = await derivePasswordHash(
            account.password,
            passwordSalt
        );

        // The repository receives protected data, never the raw password.
        return userRepository.createUser({
            name: account.name,
            email: account.email,
            passwordHash,
            passwordSalt
        });
    }

    // Check submitted credentials without revealing whether an email exists.
    async function login(credentials) {
        const user = userRepository.findWithPasswordByEmail(
            credentials.email
        );

        // Missing users still perform the expensive password calculation.
        const storedHash = user ?
            user.password_hash :
            DUMMY_PASSWORD_HASH;

        const storedSalt = user ?
            user.password_salt :
            DUMMY_PASSWORD_SALT;

        const matches = await passwordMatches(
            credentials.password,
            storedHash,
            storedSalt
        );

        // Use the same failure result for a missing email or wrong password.
        if (!user || !matches) {
            return null;
        }

        // Return only information that is safe to send to the browser.
        return {
            id: Number(user.id),
            name: user.name,
            email: user.email
        };
    }

    // Make both operations available to the authentication routes.
    return {
        login,
        register
    };
}