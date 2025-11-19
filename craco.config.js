module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Polyfill for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        path: require.resolve('path-browserify'),
        fs: false,
      };

      return webpackConfig;
    },
  },
};