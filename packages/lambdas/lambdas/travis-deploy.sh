#!/bin/bash


deploy(){
    stage="$1"
    if [ -z "$stage" ]; then
        stage="dev"
    fi
    AWS_PROFILE=flux-api sls deploy --stage "$stage"
    exit $!
}

env | grep TRAVIS
if [ "$TRAVIS" != "true" ]; then
    deploy "$1"
elif [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
    deploy "dev"
elif [ "$TRAVIS_BRANCH" != "master" ]; then
    deploy "dev"
else
    deploy "prod"
fi
