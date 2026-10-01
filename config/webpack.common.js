const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

console.log('>>> Creating build...');

const STATIC_FILES = ['robots.txt', '.well-known/tdmrep.json'];

class CopyStaticFiles {
  apply(compiler) {
    const fs = require('fs');
    const { RawSource } = compiler.webpack.sources;
    compiler.hooks.thisCompilation.tap('CopyStaticFiles', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'CopyStaticFiles',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          for (const file of STATIC_FILES) {
            const from = path.resolve(__dirname, '../public', file);
            compilation.fileDependencies.add(from);
            compilation.emitAsset(file, new RawSource(fs.readFileSync(from)));
          }
        }
      );
    });
  }
}

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        use: 'babel-loader',
        test: /.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
      },
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        type: 'asset',
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
      },
      {
        type: 'asset/resource',
        test: /\.(ttf|otf|woff2?)$/i,
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CopyStaticFiles(),
  ],
};
