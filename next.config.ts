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

const nextConfig: NextConfig = {
  // Inject the headers into every single page of the application
  async headers() {
    return [
      {
        source: '/(.*)', // The regex /(.*) matches every single route in your app
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;