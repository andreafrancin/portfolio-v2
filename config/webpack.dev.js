const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { HotModuleReplacementPlugin } = require('webpack');
const { default: merge } = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common');

console.log('>>> Running development mode...');
console.log('>>> Port: 8080');
console.log('>>> Open: chrome');

/** @type {import('webpack').Configuration} */
const devConfig = {
  mode: 'development',
  devServer: {
    historyApiFallback: true,
    port: 3000,
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
  plugins: [new HotModuleReplacementPlugin(), new ReactRefreshWebpackPlugin()],
  devtool: 'eval-source-map',
};

module.exports = merge(common, devConfig);
