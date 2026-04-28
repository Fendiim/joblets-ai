const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.userId ? { "x-user-id": options.userId } : {}),
      ...(options.headers || {})
    },
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Something went wrong.");
  }

  return payload;
}

export const api = {
  signup: (body) => request("/auth/signup", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  connectEmail: (userId) => request("/email/connect", { method: "POST", userId }),
  getDashboard: (userId) => request("/dashboard", { userId }),
  refreshInbox: (userId) => request("/emails/refresh", { method: "POST", userId }),
  loadDemo: (userId) => request("/demo/load", { method: "POST", userId }),
  updateApplication: (userId, id, body) =>
    request(`/applications/${id}`, { method: "PUT", userId, body })
};
