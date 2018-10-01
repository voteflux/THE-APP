
const path = require('path')

module.exports = {
    baseUrl: '/v/',
    outputDir: 'dist/v/',
    lintOnSave: true,
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
        loaders: {

        }
    }
}
