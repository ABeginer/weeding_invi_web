/**
 * Cloudflare Cache API (per data center). Không tồn tại khi chạy `next start`
 * trên Node, nên mọi chỗ dùng phải guard và coi cache là tùy chọn.
 */
export function getDefaultEdgeCache(): Cache | null {
  try {
    // Cloudflare Workers exposes caches.default; Node's DOM CacheStorage type
    // does not, so type it locally.
    const storage = (
      globalThis as {
        caches?: { default?: Cache };
      }
    ).caches;
    return storage?.default ?? null;
  } catch {
    return null;
  }
}
