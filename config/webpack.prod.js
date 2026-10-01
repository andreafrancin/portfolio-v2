const { DefinePlugin } = require('webpack');
const { default: merge } = require('webpack-merge');
const common = require('./webpack.common');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

console.log('>>> Running production mode...');

const prodConfig = {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }),
    new DefinePlugin({
      __API_BASE_URL__: JSON.stringify('https://back.andreafrancin.com/api/'),
    }),
  ],
  module: {
    rules: [
      {
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
        test: /.(css|sass|scss|less)$/,
      },
    ],
  },
};

module.exports = merge(common, prodConfig);
