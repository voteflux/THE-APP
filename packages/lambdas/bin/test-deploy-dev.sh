#!/bin/bash

set -e

if [ ! -e flux-api-2 ]; then
    echo "Please run this from the repository root (like ./bin/test-deploy-dev.sh)"
    exit 1
fi

cd flux-api-2
yarn install
yarn test
serverless deploy --stage dev
