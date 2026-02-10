export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export const apiFetch = (path, options = {}) => {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  return fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
};

export const getSession = async () => {
  try {
    const res = await apiFetch("/api/auth/session");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || null;
  } catch {
    return null;
  }
};

export const logout = async () => {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
};
