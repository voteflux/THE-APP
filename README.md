# THE APP README

## Getting started

You need to be using some sort of *nix system (macos, linux, or windows linux subsystem)

`./manage setup`

### Dev

* **UI**: `./manage dev ui`
* **API**: `./manage dev api`
* **FULL STACK**: `./manage dev all`

### Building

* **UI**: `./manage build ui`

### Deploying

* **API**:
  * adjust vars in `./packages/api/sls-custom.yaml` (only once; based on `sls-default-custom.yaml`)
  * `./manage deploy --stage dev`
