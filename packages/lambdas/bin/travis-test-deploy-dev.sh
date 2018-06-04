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

deploy(){
    stage="$1"
    if [ -z "$stage" ]; then
        stage="dev"
    fi
    sls deploy --stage "$stage"
    exit $!
}

if [ "$TRAVIS" != "true" ]; then
    deploy "$1"
elif [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
    deploy "dev"
elif [ "$TRAVIS_BRANCH" != "master" ]; then
    deploy "dev"
else
    deploy "prod"
fi
