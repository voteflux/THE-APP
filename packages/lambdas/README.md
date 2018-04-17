# api-v2

repository for lambda api functions and other AWS infrastructure

## CI

~~We use [lambci](https://github.com/lambci/lambci) for CI~~ template seems broken - can't get it working. Looking into other services like https://github.com/jorgebastida/gordon or functions via netlify.

Experimenting with: https://aws.amazon.com/blogs/compute/continuous-deployment-for-serverless-applications/
Using travis-ci to mirror the repo on push to codecommit on AWS (which then triggers CI above)
