const webpack = require("webpack");
const slsw = require("serverless-webpack");
const BbPromise = require("bluebird");
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')
const nodeExternals = require('webpack-node-externals')

const R = require('ramda')

const isProd = () => process.env.STAGE === "prod"

module.exports = BbPromise.try(() => {
    return {
        // externals: [ nodeExternals() ],
        mode: isProd() ? "production" : "development",
        entry: slsw.lib.entries,
        target: "node",
        // optimization: {
        //     minimize: true,
        //     // flagIncludedChunks: true,
        //     // splitChunks: {
        //     //     // name: 'chunk',
        //     //     chunks: 'all',
        //     //     // hidePathInfo: true,
        //     // },
        //     namedChunks: false,
        //     namedModules: false,
        // },
        output:{
            filename: "[name].js",
            chunkFilename: "[id].[hash].js",
            path: path.resolve(__dirname, '.webpack'),
            libraryTarget: 'commonjs',
        },
        plugins: [
            new webpack.optimize.ModuleConcatenationPlugin(),
            new webpack.optimize.SideEffectsFlagPlugin(),
            new webpack.NodeEnvironmentPlugin([
                'MONGODB_URI',
                'OPENCAGE_API',
            ]),
            new CopyWebpackPlugin([
                { from: 'flux/tmpl', to: "flux/tmpl" }
            ]),
        ],
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
        },
        module: {
            rules: [
                // {
                //     loader: "thread-loader",
                //     options: {
                //         // there should be 1 cpu for the fork-ts-checker-webpack-plugin
                //         workers: require('os').cpus().length - 1,
                //         // workers: isDevServer ? 3 : require("os").cpus().length - 1 // fastest build time for devServer: 3 threads; for production: 7 threads (os cpus minus 1)
                //     }
                // },
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader",
                    options: {
                        transpileOnly: true,
                        happyPackMode: true
                    }
                }
            ]
        }
    };
});
