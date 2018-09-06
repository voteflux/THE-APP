# members.flux.party

Static pages for members.flux.party that interact with both APIv1 and APIv2.

Cloned from flux-api/static originally and modified to work from a separate domain.

`npm run build` to build to `./dist`

## UI V2

The v2 of our UI is being worked on in `./src` and is written with vue.js

### Debugging

For debugging I use VS Code with the _Debugger for Chrome_ extension.

Config:

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Remote debugging",
            "sourceMaps": true,
            "url": "http://localhost:8080",
            "webRoot": "${workspaceRoot}"
        },
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Webpack",
            "program": "${workspaceRoot}/build/dev-server.js",
            "cwd": "${workspaceRoot}",
            "sourceMaps": true
        }
    ]
}
```
