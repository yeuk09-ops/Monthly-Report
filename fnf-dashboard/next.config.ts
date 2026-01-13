import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서버 컴포넌트에서만 snowflake-sdk 사용
  serverExternalPackages: ['snowflake-sdk'],
  // Turbopack 설정 (빈 객체로 설정하여 webpack 사용 가능하게)
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 번들에서 snowflake-sdk 제외
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
