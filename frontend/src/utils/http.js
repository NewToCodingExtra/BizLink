/**
 * Same-origin JSON fetch helper for lightweight mutations (likes, saves,
 * follows, comments, reads). Session cookie auth + CSRF header; the app no
 * longer uses Bearer tokens.
 */
function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

function setCsrfToken(token) {
  if (!token) return;
  document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', token);
}

async function refreshCsrfToken() {
  try {
    const res = await fetch('/csrf-token', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    if (data?.token) {
      setCsrfToken(data.token);
      return true;
    }
  } catch {
    // Network failure — let the original error surface.
  }
  return false;
}

export async function http(path, { method = 'GET', body, _retried = false } = {}) {
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

  // 419 = the page's CSRF token went stale (tab open across logout/login,
  // session rotated server-side). Pull a fresh token and retry once instead
  // of failing the user's comment/post.
  if (res.status === 419 && !_retried && method !== 'GET') {
    if (await refreshCsrfToken()) {
      return http(path, { method, body, _retried: true });
    }
  }

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

/**
 * Same retry-once CSRF recovery for multipart FormData posts (uploads),
 * which can't go through the JSON helper above.
 */
export async function csrfFetch(path, { method = 'POST', formData, _retried = false } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      'X-CSRF-TOKEN': csrfToken(),
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    },
    body: formData,
  });
  if (res.status === 419 && !_retried) {
    if (await refreshCsrfToken()) {
      return csrfFetch(path, { method, formData, _retried: true });
    }
  }
  return res;
}

export const httpApi = {
  get: (path) => http(path, { method: 'GET' }),
  post: (path, body = {}) => http(path, { method: 'POST', body }),
  put: (path, body = {}) => http(path, { method: 'PUT', body }),
  patch: (path, body = {}) => http(path, { method: 'PATCH', body }),
  del: (path) => http(path, { method: 'DELETE' }),
};
