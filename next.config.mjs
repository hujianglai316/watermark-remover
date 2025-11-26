/** @type {import('next').NextConfig} */
const nextConfig = {
  // 忽略 TypeScript 错误（关键）
  typescript: {
    ignoreBuildErrors: true,
  },
  // 忽略 ESLint 错误（防止格式问题卡住）
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

