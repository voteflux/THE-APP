#!/usr/bin/env bash

source .in
export PYTHONPATH=$PYTHONPATH:$PWD/sam-app/libs:sam-app/libs
export pStage=dev

pytest $@
