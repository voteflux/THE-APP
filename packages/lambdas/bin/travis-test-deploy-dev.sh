#!/bin/bash

set -e
set -x

if [ ! -e lambdas ]; then
    echo "Please run this from the repository root (like ./bin/test-deploy-dev.sh)"
    exit 1
fi


# this feels so unsafe...
set +x
mkdir -p ~/.aws
echo "[default]" >> ~/.aws/credentials
echo "aws_access_key_id = $AWS_ACCESS_KEY_ID" >> ~/.aws/credentials
echo "aws_secret_access_key = $AWS_SECRET_ACCESS_KEY" >> ~/.aws/credentials
set -x


cd lambdas
yarn install
yarn test

cp sls-default-custom.yml sls-custom.yml
sls deploy --stage dev
