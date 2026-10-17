/**
 * Media URL resolution and formatting utilities.
 */

/**
 * Normalizes any media URL to ensure local storage files are accessed via
 * root-relative paths (/storage/bizlink/...) rather than host-bound absolute URLs
 * (e.g. http://localhost:8000/storage/bizlink/...), which break across hosts,
 * ports, mobile devices, and deployments.
 *
 * Preserves blob:, data:, and valid third-party URLs (e.g. Unsplash, GCS, Pexels).
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Local object URLs or base64 data strings
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // If URL references the local bizlink storage path, strip any host prefix
  if (trimmed.includes('/storage/bizlink/')) {
    const idx = trimmed.indexOf('/storage/bizlink/');
    return trimmed.substring(idx);
  }

  // General /storage/ uploads
  if (trimmed.includes('/storage/')) {
    const idx = trimmed.indexOf('/storage/');
    return trimmed.substring(idx);
  }

  return trimmed;
}

/**
 * Returns true if the file extension or MIME represents a video.
 */
export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return clean.endsWith('.mp4') || clean.endsWith('.mov') || clean.endsWith('.webm') || clean.endsWith('.ogg');
}

/**
 * Formats byte counts into human-readable strings.
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
