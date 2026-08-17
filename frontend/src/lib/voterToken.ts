// Anonymous attendee identity used to dedupe public poll votes / survey
// responses via the X-Voter-Token header. Created once per browser.

const VOTER_TOKEN_KEY = "auda_voter_token";

export function getVoterToken(): string {
  try {
    let token = localStorage.getItem(VOTER_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(VOTER_TOKEN_KEY, token);
    }
    return token;
  } catch {
    // localStorage unavailable (e.g. private mode edge cases) — fall back to
    // an in-memory token for the lifetime of the page.
    return crypto.randomUUID();
  }
}
