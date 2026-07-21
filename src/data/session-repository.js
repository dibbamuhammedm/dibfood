/* -------------------------------------------------------------------------- */
/* Session database operations                                                */
/* -------------------------------------------------------------------------- */

// Build the database operations used to manage login sessions.
export function createSessionRepository(database) {
    // Prepare the SQL once so it can be reused for every successful login.
    const insertSession = database.prepare(`
        INSERT INTO sessions (
          user_id,
          token_hash,
          expires_at
        )
        VALUES (?, ?, ?)
        RETURNING id
    `);

    // Find the public account connected to an unexpired session.
    const selectUserByTokenHash = database.prepare(`
        SELECT
          users.id,
          users.name,
          users.email
        FROM sessions
        INNER JOIN users
          ON users.id = sessions.user_id
        WHERE sessions.token_hash = ?
          AND sessions.expires_at > ?
    `);

    // Remove the matching session when its user logs out.
    const deleteSessionByTokenHash = database.prepare(`
        DELETE FROM sessions
        WHERE token_hash = ?
    `);

    return {
        // Save a protected session token for one registered user.
        createSession(session) {
            const createdSession = insertSession.get(
                session.userId,
                session.tokenHash,
                session.expiresAt
            );

            return {
                id: Number(createdSession.id)
            };
        },

        // Return the user only when the session exists and has not expired.
        findUserByTokenHash(tokenHash, currentTime) {
            const user = selectUserByTokenHash.get(
                tokenHash,
                currentTime
            );

            if (!user) {
                return null;
            }

            // Convert SQLite's numeric id and expose no password information.
            return {
                id: Number(user.id),
                name: user.name,
                email: user.email
            };
        },
        // Delete one login session and report whether it existed.
        deleteSessionByTokenHash(tokenHash) {
            const result = deleteSessionByTokenHash.run(tokenHash);

            return Number(result.changes) > 0;
        }
    };
}