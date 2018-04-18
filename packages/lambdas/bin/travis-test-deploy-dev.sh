#!/bin/bash

set -e

if [ ! -e lambdas ]; then
    echo "Please run this from the repository root (like ./bin/test-deploy-dev.sh)"
    exit 1
fi

cd lambdas
yarn install
yarn test

cp sls-default-custom.yml sls-custom.yml
sls deploy --stage dev
