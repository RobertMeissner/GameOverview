// config-overrides.js
module.exports = {
  webpack: function (config, env) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      zlib: require.resolve("browserify-zlib"),
      fs: false, // Use false to ignore this module
      stream: require.resolve("stream-browserify"),
      util: require.resolve("util/"),
      buffer: require.resolve("buffer/"),
      assert: require.resolve("assert/"),
      stream: require.resolve("stream-browserify"),
    };
    return config;
  },
};
