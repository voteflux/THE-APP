const webpack = require("webpack");
const slsw = require("serverless-webpack");
const BbPromise = require("bluebird");

module.exports = BbPromise.try(() => {
    return {
        mode: process.env.STAGE == "prod" ? "production" : "development",
        entry: slsw.lib.entries,
        target: "node",
        plugins: [
            new webpack.DefinePlugin({}),
            new webpack.EnvironmentPlugin([
                'MONGODB_URI',
                'OPENCAGE_API'
            ])
        ],
        resolve: {
            extensions: [".ts", ".tsx", ".js"]
        },
        module: {
            rules: [
                {
                    loader: "thread-loader",
                    options: {
                        // there should be 1 cpu for the fork-ts-checker-webpack-plugin
                        workers: require('os').cpus().length - 1,
                        // workers: isDevServer ? 3 : require("os").cpus().length - 1 // fastest build time for devServer: 3 threads; for production: 7 threads (os cpus minus 1)
                    }
                },
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
