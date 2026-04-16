const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

module.exports = (env, argv) => {
  const isProd = argv && argv.mode === 'production';

  // In production (Docker), the remote is served from port 3001 of the host.
  // In development, same.
  const hrNamechangeUrl = process.env.HR_NAMECHANGE_URL || 'http://localhost:3001/remoteEntry.js';

  return {
    entry: './src/main.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',
      publicPath: 'auto',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'shell',
        remotes: {
          hrNamechange: `hrNamechange@${hrNamechangeUrl}`,
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: '^18.3.0',
            eager: true,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: '^18.3.0',
            eager: true,
          },
        },
      }),
      new HtmlWebpackPlugin({
        template: './index.html',
      }),
    ],
    devServer: {
      port: 3000,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  };
};
