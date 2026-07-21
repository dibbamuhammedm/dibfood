// Create the database operations used by registration and login.
export function createUserRepository(database) {

    // Save a protected account and return only its public information.
    const insertUser = database.prepare(`
    INSERT INTO users (
      name,
      email,
      password_hash,
      password_salt
    )
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO NOTHING
    RETURNING id, name, email
  `);
    // Find an account while keeping the email separate from the SQL command.
    const selectUserWithPasswordByEmail = database.prepare(`
    SELECT
      id,
      name,
      email,
      password_hash,
      password_salt
    FROM users
    WHERE email = ?
  `);

    return {
        // Save one account after the auth service has protected its password.
        createUser(user) {
            return insertUser.get(
                user.name,
                user.email,
                user.passwordHash,
                user.passwordSalt
            );
        },
        // Find one account so the server can compare its protected password.
        findWithPasswordByEmail(email) {
            return selectUserWithPasswordByEmail.get(email);
        }
    };
}