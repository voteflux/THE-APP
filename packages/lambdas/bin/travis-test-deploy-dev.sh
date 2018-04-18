#!/bin/bash

set -e

if [ ! -e lambdas ]; then
    echo "Please run this from the repository root (like ./bin/test-deploy-dev.sh)"
    exit 1
fi

cd lambdas
yarn install
yarn test
sls deploy --stage dev
