#!/bin/bash

set -e

cd flux-api-2
yarn install
yarn test
yarn deploy-dev
