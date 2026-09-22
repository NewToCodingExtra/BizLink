const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("bizlink_token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("bizlink_token", token);
  } else {
    localStorage.removeItem("bizlink_token");
  }
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body || {}) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body || {}) }),
  del: (path) => request(path, { method: "DELETE" }),
};

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout", {}),
  me: () => api.get("/auth/me"),
  googleRedirect: () => {
    window.location.href = `${API_BASE}/auth/google/redirect`;
  },
};

export const opportunitiesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.type) qs.set("type", params.type);
    if (params.q) qs.set("q", params.q);
    if (params.category) qs.set("category", params.category);
    if (params.page) qs.set("page", String(params.page));
    if (params.per_page) qs.set("per_page", String(params.per_page));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get(`/opportunities${suffix}`);
  },
  get: (id) => api.get(`/opportunities/${id}`),
  create: (payload) => api.post("/opportunities", payload),
  toggleLike: (id) => api.post(`/opportunities/${id}/like`, {}),
  toggleSave: (id) => api.post(`/opportunities/${id}/save`, {}),
  saved: () => api.get("/saved"),
  comments: (id) => api.get(`/opportunities/${id}/comments`),
  addComment: (id, text) => api.post(`/opportunities/${id}/comments`, { text }),
};

export const storiesApi = {
  list: () => api.get("/stories"),
  markSeen: (id) => api.post(`/stories/${id}/seen`, {}),
};

export const inboxApi = {
  conversations: () => api.get("/conversations"),
  conversation: (id) => api.get(`/conversations/${id}`),
  inquire: (payload) => api.post("/inquiries", payload),
  send: (id, text) => api.post(`/conversations/${id}/messages`, { text }),
};

export const notificationsApi = {
  list: () => api.get("/notifications"),
  markRead: (id) => api.post(`/notifications/${id}/read`, {}),
  markAllRead: () => api.post("/notifications/read-all", {}),
};

export const preferencesApi = {
  get: () => api.get("/preferences"),
  update: (payload) => api.put("/preferences", payload),
};

export const followsApi = {
  list: () => api.get("/follows"),
  toggle: (brand_id) => api.post("/follows/toggle", { brand_id }),
};

export const usersApi = {
  get: (id) => api.get(`/users/${id}`),
};

export const contactApi = {
  submit: (payload) => api.post("/contact", payload),
};

export default api;
