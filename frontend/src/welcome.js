const WELCOME_KEY = "tranzalgo-welcomed";

export function hasSeenWelcome() {
  try {
    return localStorage.getItem(WELCOME_KEY) === "1";
  } catch {
    // If storage is unavailable, don't trap the user on the intro.
    return true;
  }
}

export function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function resetWelcome() {
  try {
    localStorage.removeItem(WELCOME_KEY);
  } catch {
    /* ignore */
  }
}
