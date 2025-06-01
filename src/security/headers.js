// headers.js: Set security headers (for server or static host config)
export function setSecurityHeaders() {
  if (typeof document !== 'undefined') {
    document.head.querySelectorAll('meta[http-equiv]').forEach(e => e.remove());
    let meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    // Loosen CSP for localhost development (allows Supabase and Google Fonts)
    if (window.location.hostname === 'localhost') {
      // Relaxed CSP for local development (keep for future dev use)
      meta.content = "default-src 'self' https://gtmrpijcmiqsobgoaiua.supabase.co wss://gtmrpijcmiqsobgoaiua.supabase.co; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self';";
    } else {
      // Strict CSP for production (recommended)
      meta.content = "default-src 'self'; font-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';";
    }
    document.head.appendChild(meta);
    const metaXFO = document.createElement('meta');
    metaXFO.httpEquiv = 'X-Frame-Options';
    metaXFO.content = 'DENY';
    document.head.appendChild(metaXFO);
  }
}
