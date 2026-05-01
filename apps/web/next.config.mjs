import withPWA from 'next-pwa';

const pwa = withPWA({
  dest:             'public',          // outputs sw.js + workbox files to public/
  register:         true,              // auto-register service worker
  skipWaiting:      true,              // activate new SW immediately
  disable:          process.env.NODE_ENV === 'development',  // off in dev (avoids cache confusion)
  runtimeCaching: [
    // ── API calls — network first, fall back to cache ─────────────────────────
    {
      urlPattern: /^https?:\/\/.*\/api\/v1\/.*/i,
      handler:    'NetworkFirst',
      options: {
        cacheName:          'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries:     64,
          maxAgeSeconds:  60 * 5,  // 5 minutes
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // ── Google Fonts ──────────────────────────────────────────────────────────
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler:    'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries:     4,
          maxAgeSeconds:  365 * 24 * 60 * 60,  // 1 year
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // ── Static assets — cache first ───────────────────────────────────────────
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|eot)$/i,
      handler:    'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries:     128,
          maxAgeSeconds:  30 * 24 * 60 * 60,  // 30 days
        },
      },
    },
    // ── Next.js pages — stale-while-revalidate ────────────────────────────────
    {
      urlPattern: /^https?:\/\/.*\/_next\/static\/.*/i,
      handler:    'StaleWhileRevalidate',
      options: {
        cacheName: 'nextjs-static',
        expiration: {
          maxEntries:     200,
          maxAgeSeconds:  24 * 60 * 60,  // 1 day
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'vimeo.com' },
      { protocol: 'https', hostname: 'i.vimeocdn.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source:      '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1/:path*`,
      },
    ];
  },
};

export default pwa(nextConfig);
