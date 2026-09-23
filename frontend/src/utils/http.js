/**
 * Same-origin JSON fetch helper for lightweight mutations (likes, saves,
 * follows, comments, reads). Session cookie auth + CSRF header; the app no
 * longer uses Bearer tokens.
 */
function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

export async function http(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': csrfToken(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    const error = new Error(data?.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const httpApi = {
  get: (path) => http(path, { method: 'GET' }),
  post: (path, body = {}) => http(path, { method: 'POST', body }),
  put: (path, body = {}) => http(path, { method: 'PUT', body }),
  patch: (path, body = {}) => http(path, { method: 'PATCH', body }),
  del: (path) => http(path, { method: 'DELETE' }),
};
