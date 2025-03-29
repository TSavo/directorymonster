/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Needed for Docker deployment
  images: {
    domains: ['example.com'], // Add actual image domains as needed
  },
  // Enable CORS in development
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },
  // Enhanced file watching for Docker environment
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Use polling for file watching in Docker
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding
        ignored: /node_modules/,
      };

      // Improve module resolution
      config.resolve.modules = [
        ...(config.resolve.modules || []),
        './src',
        './node_modules'
      ];
      
      // Ensure aliases work correctly
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, './src'),
      };
    }
    return config;
  },
}

module.exports = nextConfig