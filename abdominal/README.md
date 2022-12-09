# ELECTRON

## Prerequisite

- node 16.17.1

## Environmental Setup

```
yarn
yarn prepare
```

### Release

```
yarn run release
```

## Tips

### Logging

This project has been adopted electron-log package.

- Basic usage example
  - main: `import * as log from 'electron-log'; log.info("hoge")`
  - render: `window.log.info("hoge")`
- Choose logging level from the following options:
  - `error, warn, info, verbose, debug, silly`
- Log is transported to
  - console
  - file
    - on Linux: `~/.config/{app name}/logs/{process type}.log`
    - on macOS: `~/Library/Logs/{app name}/{process type}.log`
    - on Windows: `%USERPROFILE%\AppData\Roaming\{app name}\logs\{process type}.log`

You can also catch errors, specify logging scope, and so on.
For details, see [the documentations](https://github.com/megahertz/electron-log).
