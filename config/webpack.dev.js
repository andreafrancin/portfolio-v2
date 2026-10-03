const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { HotModuleReplacementPlugin, DefinePlugin } = require('webpack');
const { default: merge } = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common');

console.log('>>> Running development mode...');
console.log('>>> Port: 8080');
console.log('>>> Open: chrome');

const devConfig = {
  mode: 'development',
  devServer: {
    historyApiFallback: true,
    port: 8081,
    proxy: [
      {
        context: ['/media'],
        target: 'https://andreafrancin-images-bucket-2025.s3.amazonaws.com',
        changeOrigin: true,
        secure: true,
        pathRewrite: { '^/media': '' },
      },
    ],
    hot: true,
    open: {
      app: {
        name: 'chrome',
      },
    },
  },
  module: {
    rules: [
      {
        use: ['style-loader', 'css-loader', 'sass-loader'],
        test: /\.(css|sass|scss|less)$/,
      },
    ],
  },
  plugins: [
    new HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin(),
    new DefinePlugin({
      __API_BASE_URL__: JSON.stringify('http://localhost:8000/api/'),
    }),
  ],
  devtool: 'eval-source-map',
};

module.exports = merge(common, devConfig);
