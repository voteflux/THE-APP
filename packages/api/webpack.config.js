const webpack = require('webpack')
const slsw = require('serverless-webpack');
const BbPromise = require('bluebird');

module.exports = BbPromise.try(() => {
  return slsw.lib.serverless.providers.aws.getAccountId()
  .then(accountId => ({
    entry: slsw.lib.entries,
    target: 'node',
    plugins: [
      new webpack.DefinePlugin({
        AWS_ACCOUNT_ID: `${accountId}`,
      }),
    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: "ts-loader" }
      ]
    }
  }));
});
