const { CheckerPlugin } = require('awesome-typescript-loader')
const path = require('path')

module.exports = {
  baseUrl: '/v/',
  outputDir: 'dist/v/',
  lintOnSave: true,
  configureWebpack: {
    resolve: {
      alias: {
        "@lib": path.resolve(__dirname, "../lib/lib/")
      }
    }
  }
}
