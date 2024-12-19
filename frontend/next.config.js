module.exports = {
    webpack: (config) => {
      config.cache = {
        type: "memory", // Use memory caching instead of file caching
      };
      return config;
    },
    reactStrictMode: false,
  };