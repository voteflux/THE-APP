# api-v2

repository for lambda api functions and other AWS infrastructure

## Dev stuff

* Use `yarn` instead of `npm`
* Check `./bin/install-dev-env.sh` (or run that) for basic stuff
* You'll need a `lambdas/sls-custom.yml` file to run serverless - copy over the `sls-default-custom.yml` for default stuff (note: use these files to parameterise the `serverless.yml` config, e.g. to set different aws profiles.)

## CI

Using Travis-CI to run tests and then deploy via `serverless`.

See `.travis.yml` and `./bin/travis-test-deploy.sh` for details.
