// Admins sign in with a username, but Supabase Auth needs an email, so each
// username maps to a placeholder address on the never-deliverable .invalid
// domain ("Tooshtattedthat" -> tooshtattedthat@users.tooshtattoos.invalid).
// Nothing is ever emailed there, so these accounts can't use password-reset
// emails; a master admin resets passwords instead.

const DOMAIN = "users.tooshtattoos.invalid";

/** Letters, numbers, dot, dash, underscore; 3–32 characters. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${DOMAIN}`;
}

/** The username behind a placeholder address, or the address itself for older email accounts. */
export function emailToUsername(email: string): string {
  const suffix = `@${DOMAIN}`;
  return email.toLowerCase().endsWith(suffix)
    ? email.slice(0, -suffix.length)
    : email;
}
