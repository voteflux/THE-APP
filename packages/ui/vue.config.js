
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const tsImportPluginFactory = require('ts-import-plugin')

module.exports = {
    baseUrl: '/v/',
    outputDir: 'dist/v/',
    lintOnSave: true,
    parallel: true,
    configureWebpack: {
        mode: process.env.STAGE === "prod" ? "production" : "development",
        optimization: {
            splitChunks: {
                chunks: 'all',
                maxSize: 3000000,
            }
        },
        output: {
            filename: "[name].bundle.js",
            chunkFilename: "[name].chunk.js"
        },
        module: {
            rules: [
            ]
        },
        plugins: [
            new CopyWebpackPlugin([ { from: "static/", to: "../" } ]),
        ],
    },
}
