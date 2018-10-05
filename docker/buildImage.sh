#!/usr/bin/env bash

if [ "$(basename `pwd`)" != "docker" ]; then
    if [ -d "./docker" ]; then
        cd docker
    else
        echo "Please run this script from the repo root"
        exit 1
    fi
fi

docker build . -t xertrov/build-flux:latest "$@"
