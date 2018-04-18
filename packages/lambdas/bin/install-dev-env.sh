#!/bin/bash

echo "NOTE: You'll need yarn installed!"
yarn global add serverless

cp lambdas
cp sls-default-custom.yml sls-custom.yml
