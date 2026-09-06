export const track = (name, data) => {
  if (typeof window === 'undefined') return;
  if (window.insightflare && typeof window.insightflare.track === 'function') {
    try {
      window.insightflare.track(name, data);
    } catch (e) {
      console.warn('[analytics] track failed:', e);
    }
  }
};

export const trackOnce = (name, data) => {
  if (typeof window === 'undefined') return;
  if (window.insightflare && typeof window.insightflare.trackOnce === 'function') {
    try {
      window.insightflare.trackOnce(name, data);
    } catch (e) {
      console.warn('[analytics] trackOnce failed:', e);
    }
  }
};

export const bucketDurationMs = (ms) => {
  if (ms < 0) return 'past';
  const h = ms / 3_600_000;
  if (h < 1) return 'lt_1h';
  if (h < 24) return 'lt_1d';
  if (h < 24 * 7) return 'lt_1w';
  if (h < 24 * 30) return 'lt_1m';
  if (h < 24 * 365) return 'lt_1y';
  return 'gte_1y';
};

export const bucketFileSize = (bytes) => {
  const kb = bytes / 1024;
  if (kb < 100) return 'lt_100kb';
  if (kb < 1024) return 'lt_1mb';
  if (kb < 5120) return 'lt_5mb';
  return 'gte_5mb';
};
