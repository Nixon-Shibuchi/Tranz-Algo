const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

function getToken() {
  return localStorage.getItem("tranz_token");
}

export async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }

  if (!res.ok) {
    const detail = data?.detail;
    let message = res.statusText;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((d) => (typeof d === "string" ? d : d.msg || JSON.stringify(d)))
        .join(" ");
    }
    // Soften leftover technical email validation text from older responses
    if (/special-use|reserved name|not a valid email/i.test(message)) {
      message = "Please enter a valid email address (example: name@gmail.com).";
    }
    throw new Error(message || "Request failed");
  }
  return data;
}

export function setToken(token) {
  if (token) localStorage.setItem("tranz_token", token);
  else localStorage.removeItem("tranz_token");
}
