const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// Load environment variables
const env = dotenv.config().parsed || {};

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    mode: argv.mode,
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      hot: true,
      port: 3000,
    },
    entry: {
      popup: "./src/index.js",
      background: "./src/background.js"
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader"
          }
        },
        {
          test: /\.(sass|scss)$/,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader'
          ]
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env": JSON.stringify(env)
      }),
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        filename: "index.html"
      }),
      new CopyPlugin({
        patterns: [
          { from: "src/manifest.json", to: "manifest.json" },
        ],
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
      })
    ],
    resolve: {
      extensions: [".js", ".jsx"]
    }
  };
};
