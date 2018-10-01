
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const tsImportPluginFactory = require('ts-import-plugin')

module.exports = {
    baseUrl: '/v/',
    outputDir: 'dist/v/',
    lintOnSave: true,
    parallel: true,
    chainWebpack: config => {
        const rules = config.module.rules
        console.log(rules.store.ts)
    },
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
                // {
                //     test: /\.(png|woff|eot|ttf|woff2)(\?.*$|$)/,
                //     loader: "base64-inline-loader?limit=250000",
                // },
                // {
                //   test: /\.js$/,
                //   loader: 'babel-loader',
                //   include: [path.join(__dirname, 'src')],
                // }
                // {
                //     test: /\.(jsx|tsx|js|ts)$/,
                //     loader: 'ts-loader',
                //     options: {
                //         transpileOnly: true,
                //         happyPackMode: true,
                //         getCustomTransformers: () => ({
                //             before: [ tsImportPluginFactory({
                //                 libraryName: "vuetify",
                //                 libraryDirectory: "es5/components"
                //             }) ]
                //         }),
                //         compilerOptions: {
                //             module: 'es2015'
                //         }
                //     },
                //     exclude: /node_modules/
                // },
            ]
        },
        plugins: [
            new CopyWebpackPlugin([ { from: "static/", to: "../" } ]),
            // [require('babel-plugin-transform-imports'), {
            //     "vuetify": {
            //         "transform": "vuetify/es5/components/${member}",
            //         "preventFullImport": true
            //     }
            // }]
        ]
    }
}
