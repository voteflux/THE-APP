# THE APP README

## Getting started

See below for system specific instructions.

This will work for Windows, Macos, and Linux, though for Windows you'll need the linux subsystem (Ubbuntu 18.04 preferred, see below)

Ultimately you'll need these in your path: `python3`, `pip3`, `virtualenv`, `npm`, `node` (v8) -- we'll set them up in a moment.

Running `./manage` will set up dependencies and show you available commands.

After you've set up your dev environment, run `git clone https://github.com/voteflux/THE-APP && cd THE-APP`. You'll then be able to run `./manage`, etc.

### Windows

(WIP)

* Install windows linux system (ubuntu 18.04 preferred, or 16.04 if 18.04 isn't available for some reason) (todo: add link to guide)
* You may or may not need to reboot at this time
* Run `bash` or `bash.exe` (should be in start menu or you can use run prompt / `cmd` / `powershell`) and then run all commands in that
* Follow the setup instructions for Ubuntu to install dependencies and NVM
* Then you're good to go, just remember to run all the commands in `bash` and not `cmd` or `powershell`

### Ubuntu

* Install required packages: `sudo apt update && sudo apt install -y curl python3 python3-pip python3-virtualenv tmux git build-essential`
  * note: there might be trouble on ubuntu 16.04 and below wrt to python3, though I'm not certain of that. Please create an isssue if you have trouble with python3 deps
* If you don't have nodejs v8+ installed already: [install NVM](#install-nvm)
* Should be all ready to go after that

### MacOS

* For python 3.6 you'll need `brew` installed (See [Homebrew](https://brew.sh/))
* `brew install python3 tmux`
* [Install NVM](#install-nvm)
* done

### Install NVM

* Install [`nvm`](https://github.com/creationix/nvm): `curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash`
* Ensure your .bashrc or .zshrc is configured correctly with `nvm` as per the last few lines of output when you run the above script.
* In a new terminal run:
  * `nvm install 8`
  * `nvm alias default 8`
  * `nvm use default`
* Done

## Project structure

We use `lerna` to manage the project / packages / node dependencies / etc. All new code should be typescript (though you don't need to go crazy on types; see [typing principles](#typing-principles) for more.

There are three packages as part of this repo:

* `./packages/api` -- a serverless/lambda app on AWS
* `./packages/lib` -- common functions and types; anything that is shared between the UI and API should be in here
* `./packages/ui` -- the vue UI package which builds the member app and the admin app (with the old utilities too)

The python app manager script also lives in `./py_app_manager`

Virtually everything should be done through the python app manager script (`./manage`) - if a function you'd like isn't available through it please create an issue for that.

## `./manage` - the "do everything" tool for dev/building/etc

`./manage` is a bash script wrapping a small python module.

In general you use it like `./manage [cmd] [args...] [--flags...]`, though run `./manage help` or `./manage [cmd] --help` if you ever get stuck.

If you just want to get something up an running immediately run `./manage dev all`

### `./manage` bash script details

It performs part of the initialization procedure the app relies on:

* Detects if we're on netlify and sets `IS_NETLIFY` env var
* checks for `python3 -m virtualenv` and `python3 -m pip` commands work (note: the `virtualenv` and `pip3` commands aren't used to avoid some complexities around paths and versions)
* checks for `npm` and `node` - though doens't check node version >= 8
* warns if `tmux` isn't found (this is only required for `./manage dev`)
* sets a default `./packages/api/sls-custom.yml` file if one is note detected (you should edit this if doing any API work)
* Adds some default dummy credentials to `~/.aws/credentials` if the file isn't detecte **(WARNING: this is meant to be non-destructive (append only) but it's not well tested, improvements welcome)**. The reason for doing this is so `./manage dev api` works as Serverless expects to be given credentials even if they don't work.
* Creates a virtualenv for the main python script's dependencies
* Exports `MOST_RECENT_TAG` env var (required for production builds)
* Starts the main python script (`./py_app_manager/__main__.py`)

### The python app management script

This is the meat of the build script. The script runs sort of like this:

* import std libraries and functions for setting up python and node dependencies
* check for conditions in which to skip dependency installs (if the repository is dirty, basically -- presumably this means it's a dev environment which means we don't need to install deps)
* install python3 deps, then npm deps (which is just `lerna` to start with), then have `lerna` set up the dependencies for each package
* do normal python imports for any libraries which are part of our dependencies
* interpret arguments and run dev/build commands, etc

### Adding dependencies

To add a dependency for the *management python app* run `./manager mgr_add_dep dep1 dep2 dep3 ...`. They're installed from pip and `requirements.txt` is automatically updated

(WIP) To add a dependency for one of the packages run `./manager addto [package_name] dep1 dep2 dep3 ...`. You can use `all` instead of `ui`/`api`/`lib` for the package name to add to all packages, too. You can also run `./manage add dep1 dep2 dep3 ...` to add deps to all packages, though you'll be asked to confirm.

### Developing

These will run in a tmux session (mouse mode enabled). You can quit either by `ctrl-c`ing all the processes, or by `ctrl-b d` to detach (the python `./manage` script will kill the processes).
If you haven't used `tmux` before: it's pretty nice (an advanced version of `screen`) - would recommend googling around for some intro articles.

* **UI**: `./manage dev ui` (vue serve, tsc flux-lib)
* **API**: `./manage dev api` (serverless offline, mongodb dev, tsc flux-lib, tsc api)
* **FULL STACK**: `./manage dev all` (all of the above)

### Building (UI)

* **UI**: `./manage build ui`

### Deploying (API)

* **API**:
  * adjust vars in `./packages/api/sls-custom.yaml` (only once; based on `sls-default-custom.yaml`)
  * `./manage deploy --stage dev`

### Updating production

Production is updated when a new version tag is added using `lerna publish` - leave this to @XertroV for the moment.

Note: if you've been doing anything with tags outside `lerna` you might need to `git push origin [tag-name]` or `git push --follow-tags` so CI detects the latest version. (Also, maybe `git config --global push.followTags true` to set the global git config to do this)

## App overview - tech and things / Contributing notes

Please don't commit built files (no need for this repo), and make sure to use `.gitignore` if you add anything that needs ignoring.

### UI

The UI is a Vue.js app.

**Framework**: The UI is pretty basic at the moment, but the goal is to standardize it using [Vuetify](https://vuetifyjs.com/en/) (UI framework based on material design). One of the main goals of this is to have both a good mobile UI and a good web UI from the same codebase. It will also be highly compatible with the upcoming admin UI (those features are currently in the main UI, but admin stuff will rarely be done from a phone so it makes sense to break those components out).

**API / web requests**: we use a custom `WebRequest` object which all API methods return. It's heavily inspired by `Elm`'s `WebRequest` mixed in with `Rust`'s way of doing `Maybe` and `Either` (`Option` and `Result`). It has four states: NotRequested, Loading, Success, Failed. The latter two states have data you can access using `.unwrap()` and `.unwrapError()`. Components with requests should store all requests in `this.req` (e.g. `this.$flux.api.v2.getRoles(...).then(r => this.req.roles = r)`). UI can then be based directly on the request state:

```vuejs
<template>
  <div>
    <div v-if="req.roles.isSuccess()"> Your roles are: {{ req.roles.unwrap() }} </div>
    <div v-else-if="req.roles.isFailed()"> <Error>{{ req.roles.unwrapError() }}</Error> </div>
    <div v-else> <Loading>Loading your roles...</Loading>
  </div>
</template>

<script type="ts">
import Vue from 'vue'
import { Auth } from 'flux-lib/types/db'
import { WebRequest } from 'flux-lib/WebRequest'
export default Vue.extend({
  props: { auth: { type: Object as () => Auth } },
  data: () => ({
    // note: it's planned to code up a mixin for requests to make them nicer / have better type checking
    req: {
      roles: WebRequest.NotRequested()
    },
    async created() {
      this.req.roles = WebRequest.Loading()
      this.req.roles = await this.$flux.api.v2.getRoles(this.auth)
    }
  })
})
</script>
```

**Typescript & Typings**: we use Typescript wherever possible and ideally you should add at least half decent typings to functions. Often typescript can infer the type, in which case 👍, but especially for stuff like API methods having types is really useful. Additionally we use `io-ts` for dynamic type checking at runtime boundaries (see API and Lib sections for more). You might be asked to add types if you make a pull request, so please mention if this isn't a strong point and you need some assistance.

### API

(TODO)

Key tech: lambda, serverless, mongo, io-ts, tsmonad, flux-lib

### Lib / Flux-lib

(TODO)

mostly holds types and functions shared across API and UI
