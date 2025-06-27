const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

// Load backend/.env, using BACKEND_PORT instead of PORT
require("dotenv").config({
  path: path.join(__dirname, "..", "backend", ".env"),
});

// Use BACKEND_PORT if defined, otherwise fall back to PORT (from the backend
// server) and finally default to 5000.
const backendPort = process.env.BACKEND_PORT || process.env.PORT || 5050;

module.exports = {
  webpack: (config) => config,
  devServer: (configFunction) => {
    return (proxy, allowedHost) => {
      const config = configFunction(proxy, allowedHost);

      config.setupMiddlewares = (middlewares, devServer) => {
        if (!devServer) {
          throw new Error("webpack-dev-server is not defined");
        }

        devServer.app.use(
          "/api",
          createProxyMiddleware({
            target: `http://localhost:${backendPort}`,
            changeOrigin: true,
          })
        );

        devServer.app.use(
          "/uploads",
          createProxyMiddleware({
            target: `http://localhost:${backendPort}`,
            changeOrigin: true,
          })
        );

        return middlewares;
      };

      // Restrict allowed hosts to common dev hosts for better security
      config.allowedHosts = ["localhost", "127.0.0.1", ".local", ".test"];

      return config;
    };
  },
};
