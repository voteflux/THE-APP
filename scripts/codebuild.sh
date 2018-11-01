#!/usr/bin/env bash

export LOCAL_CODEBUILD_ENV="true"
./scripts/codebuild_build.sh \
    -i xertrov/flux-build:latest \
    -a ./.codebuild_tmp \
    -e "LOCAL_CODEBUILD_ENV=$LOCAL_CODEBUILD_ENV"
