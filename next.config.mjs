/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Force clean build by changing distDir
  distDir: 'dist-v2',
};

export default nextConfig;
