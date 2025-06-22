const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = {
  webpack: (config) => config,
  devServer: (configFunction) => {
    return (proxy, allowedHost) => {
      const config = configFunction(proxy, allowedHost);
      config.setupMiddlewares = (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }
        devServer.app.use(
          '/api',
          createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
          })
        );
        devServer.app.use(
          '/uploads',
          createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
          })
        );
        return middlewares;
      };
      return config;
    };
  },
};