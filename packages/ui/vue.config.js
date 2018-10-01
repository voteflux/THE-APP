
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    baseUrl: '/v/',
    outputDir: 'dist/v/',
    lintOnSave: true,
    parallel: true,
    configureWebpack: {
        mode: process.env.STAGE == "prod" ? "production" : "development",
        optimization: {
            splitChunks: {
                chunks: 'all',
                maxSize: 2000000,
                minSize: 30000,
            }
        },
        output: {
            filename: "[name].bundle.js",
            chunkFilename: "[name].chunk.js"
        },
        module: {
            rules: [
                {
                    test: /\.(png|woff|eot|ttf|woff2)(\?.*$|$)/,
                    loader: "base64-inline-loader?limit=250000",
                },
            ]
        },
        plugins: [
          new CopyWebpackPlugin([ { from: "./static/**/*", to: "./dist/" } ])
        ]
    }
}
