import app from '../server';

export default function handler(req: any, res: any) {
  // 1. Permissive CORS headers for Vercel preview & production deployments
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range, x-ethiolearn-auth, x-ethiolearn-session-token');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // 2. Safe URL Normalization
  if (req.url) {
    const isGenericEntry = 
      req.url === '/api/index' || 
      req.url === '/api/index.ts' || 
      req.url === '/api/vercel' || 
      req.url === '/api/vercel.ts' ||
      req.url.startsWith('/api/index?') ||
      req.url.startsWith('/api/index.ts?') ||
      req.url.startsWith('/api/vercel?') ||
      req.url.startsWith('/api/vercel.ts?');

    if (isGenericEntry) {
      // Vercel serverless rewrite collapsed the path into the function name.
      // Recover the original subpath if forwarded headers exist.
      const candidateUri = req.headers['x-forwarded-uri'] || req.headers['x-original-url'];
      if (typeof candidateUri === 'string' && candidateUri.startsWith('/api/') && !candidateUri.startsWith('/api/index') && !candidateUri.startsWith('/api/vercel')) {
        req.url = candidateUri;
      } else {
        const matchHeader = req.headers['x-now-route-matches'];
        if (typeof matchHeader === 'string') {
          const match = matchHeader.match(/1=([^&]+)/);
          if (match) {
            const sub = decodeURIComponent(match[1]);
            const queryIdx = req.url.indexOf('?');
            const qs = queryIdx >= 0 ? req.url.slice(queryIdx) : '';
            req.url = '/api/' + sub.replace(/^\/+/, '') + qs;
          }
        }
      }
    } else if (!req.url.startsWith('/api')) {
      // If Vercel stripped /api prefix (e.g. /books/download-pdf?id=...)
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }

  return app(req, res);
}
