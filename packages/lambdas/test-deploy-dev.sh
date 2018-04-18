#!/bin/bash

set -e

cd flux-api-2
yarn test
yarn deploy-dev
