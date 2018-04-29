# Flux api-v2

repository for lambda api functions and other AWS infrastructure

## Dev stuff

* Use `yarn` instead of `npm`
* Check `./bin/install-dev-env.sh` (or run that) for basic stuff
* You'll need a `lambdas/sls-custom.yml` file to run serverless - copy over the `sls-default-custom.yml` for default stuff (note: use these files to parameterise the `serverless.yml` config, e.g. to set different aws profiles.) In essence this file just describes the AWS profile to use + stage stuff.
* All handlers should be `async` functions - we use node v8+ (no v6 support)

Note: you might need to install the aws CLI tool to use serverless.

All lambda functions should live in `./lambdas`.
The routing for these functions is defined in `serverless.yml`.

For UI stuff please see [voteflux/member-ui-v2](https://github.com/voteflux/member-ui-v2)

**All handlers should be written either for the NodeJSv8 lambda runtime, or the Python3.6 runtime**. Python handlers (if they exist) live in `./py-lambdas`. Currently this isn't being used, though we might implement some python lambdas in the future. Note: this will require a new serverless config and might complicate custom domains. For the moment use NodeJS - Python is a possibility later on. Due to [cold start](https://theburningmonk.com/2017/06/aws-lambda-compare-coldstart-time-with-different-languages-memory-and-code-sizes/) times we should avoid using C# and Java lambdas

## Deployment details

Deployment is managed via the `lambdas/serverless.yml` file (including custom domains)

### Certificates

Currently AWS holds certs for:

* api.flux.party
* dev.api.flux.party
* staging.api.flux.party
* prod.api.flux.party

## CI

Using Travis-CI to run tests and then deploy to dev via `serverless`.
Anything pushed to master will be deployed at `dev.api.flux.party`

See `.travis.yml` and `./bin/travis-test-deploy.sh` for details.

## Links:

* [Serverless Docs](https://serverless.com/framework/docs/)
