const path = require("path");
const BundleTracker = require("webpack-bundle-tracker");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devMode = process.env.ENV !== "PROD";

module.exports = {
  context: __dirname,
  entry: {
    main: "./assets/js/app.js",
    css: "./assets/css/app.scss"
  },
  output: {
    path: path.resolve(__dirname, "assets/bundles/"),
    publicPath: "auto", // necessary for CDNs/S3/blob storages
    filename: "[name]-[contenthash].js",
  },
  module: {
    rules: [
      {
        test: /\.s?(c|a)ss$/,
        use: [
          devMode ? "style-loader" : MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader"
        ],
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new BundleTracker({ path: __dirname, filename: "webpack-stats.json" }),
  ],
};