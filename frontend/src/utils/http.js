/**
 * Same-origin JSON fetch helper for lightweight mutations (likes, saves,
 * follows, comments, reads). Session cookie auth + CSRF header; the app no
 * longer uses Bearer tokens.
 */
export function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

export function setCsrfToken(token) {
  if (!token) return;
  let meta = document.querySelector('meta[name="csrf-token"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'csrf-token');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', token);
}

export async function refreshCsrfToken() {
  try {
    const res = await fetch('/csrf-token', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (data?.token) {
      setCsrfToken(data.token);
      return data.token;
    }
  } catch {
    // Network failure — let the original error surface.
  }
  return null;
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
  const token = csrfToken();
  if (formData instanceof FormData && token && !formData.has('_token')) {
    formData.append('_token', token);
  }

  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      'X-CSRF-TOKEN': token,
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    },
    body: formData,
  });

  if (res.status === 419 && !_retried) {
    const freshToken = await refreshCsrfToken();
    if (freshToken) {
      if (formData instanceof FormData) {
        formData.set('_token', freshToken);
      }
      return csrfFetch(path, { method, formData, _retried: true });
    }
  }
  return res;
}

/**
 * Multipart file upload with real progress tracking via XMLHttpRequest,
 * supporting automatic 419 CSRF retry.
 */
export function uploadWithProgress(file, { onProgress, path = '/uploads', _retried = false } = {}) {
  return new Promise((resolve, reject) => {
    const token = csrfToken();
    const fd = new FormData();
    fd.append('file', file);
    if (token) {
      fd.append('_token', token);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', path);
    xhr.setRequestHeader('X-CSRF-TOKEN', token);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.withCredentials = true;

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = async () => {
      let json = null;
      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        json = null;
      }

      if (xhr.status === 419 && !_retried) {
        const fresh = await refreshCsrfToken();
        if (fresh) {
          try {
            const retriedRes = await uploadWithProgress(file, { onProgress, path, _retried: true });
            resolve(retriedRes);
            return;
          } catch (err) {
            reject(err);
            return;
          }
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(json || {});
      } else {
        const msg = json?.message || (xhr.status === 419 ? 'Session expired (419). Please try again.' : `Upload failed (${xhr.status})`);
        const err = new Error(msg);
        err.status = xhr.status;
        err.data = json;
        reject(err);
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed. Please check your network connection.'));
    xhr.send(fd);
  });
}

export const httpApi = {
  get: (path) => http(path, { method: 'GET' }),
  post: (path, body = {}) => http(path, { method: 'POST', body }),
  put: (path, body = {}) => http(path, { method: 'PUT', body }),
  patch: (path, body = {}) => http(path, { method: 'PATCH', body }),
  delete: (path, body) => http(path, { method: 'DELETE', body }),
  del: (path, body) => http(path, { method: 'DELETE', body }),
};
