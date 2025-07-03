/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BOT_API_URL: process.env.BOT_API_URL || "http://localhost:3001",
    SOCKET_URL: process.env.SOCKET_URL || "http://localhost:3001",
  },
  images: {
    domains: ['crafthead.net', 'mc-heads.net'],
  },
}

module.exports = nextConfig 