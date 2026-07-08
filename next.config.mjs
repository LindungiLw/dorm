/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The foundation slice prioritizes a runnable dev experience; production hardening
  // (CSP headers, image domains, etc.) is layered on in later phases.
};

export default nextConfig;
