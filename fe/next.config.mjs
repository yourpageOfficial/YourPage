/** @type {import('next').NextConfig} */

const minioHostname = process.env.MINIO_HOSTNAME || "minio";

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      // Restrict to MinIO only — prevents loading images from arbitrary origins
      { protocol: "http", hostname: minioHostname },
      { protocol: "https", hostname: minioHostname },
      // Allow localhost for development
      { protocol: "http", hostname: "localhost" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://be:8080/api/:path*" },
      { source: "/storage/:path*", destination: "http://minio:9000/:path*" },
    ];
  },
  async headers() {
    return [
      {
        source: "/storage/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "CDN-Cache-Control", value: "public, max-age=31536000" },
        ],
      },
      {
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Security headers for all routes
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              `img-src 'self' data: blob: http://${minioHostname} https://${minioHostname}`,
              `media-src 'self' http://${minioHostname} https://${minioHostname}`,
              "connect-src 'self'",
              "font-src 'self' https://fonts.gstatic.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
