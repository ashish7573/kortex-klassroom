import type { NextConfig } from "next";

// Define our strict security headers
const securityHeaders = [
  {
    // Prevents your site from being put inside an iframe by another website (Blocks Clickjacking)
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    // Forces the browser to strictly trust the file types the server declares (Blocks MIME-sniffing XSS)
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    // Hides your user's exact URL path when they click a link leaving your website
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    // Physically blocks the browser from accessing device features to protect student/krew privacy
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  },
  {
    // Forces browsers to ONLY connect to your app via secure HTTPS (Blocks Man-in-the-Middle attacks)
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    // Optimizes DNS resolution for external links while maintaining security
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  }
];

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kortex-klassroom';

const nextConfig: NextConfig = {
  // 🔒 FIX: Prevent Turbopack from bundling firebase-admin and crashing on ESM imports
  serverExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose'],
  
  // ⚡ Performance: Image optimization configuration
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
    minimumCacheTTL: 86400,
  },
  
  // Inject the headers into every single page of the application
  async headers() {
    return [
      {
        source: '/(.*)', // The regex /(.*) matches every single route in your app
        headers: securityHeaders,
      },
      {
        source: '/thumbnails/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 🔄 Reverse proxy for Firebase Authentication custom domain white-labeling
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://${FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
