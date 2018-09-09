# THE APP README

## Getting started

You need to be using some sort of *nix system (macos, linux, or windows linux subsystem)

You'll need these in your path: `python3`, `pip3`, `virtualenv`, `npm`, `node` (v8)

Running `./manage` will set up dependencies and such

### Dependencies

#### Ubuntu

`sudo apt install python3 python3-pip python3-virtualenv`

### Dev

These will run in a tmux session (mouse mode enabled). You can quit either by `ctrl-c`ing all the processes, or by `ctrl-b d` to detach (the python `./manage` script will kill the processes).

* **UI**: `./manage dev ui` (vue serve, tsc flux-lib)
* **API**: `./manage dev api` (serverless offline, mongodb dev, tsc flux-lib, tsc api)
* **FULL STACK**: `./manage dev all` (all of the above)

### Building

* **UI**: `./manage build ui`

### Deploying

* **API**:
  * adjust vars in `./packages/api/sls-custom.yaml` (only once; based on `sls-default-custom.yaml`)
  * `./manage deploy --stage dev`
