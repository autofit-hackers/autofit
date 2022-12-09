# ELECTRON

## Prerequisite

- node 16.17.1
- Kinect
  - [Azure Kinect Sensor SDK v1.4.1](https://github.com/microsoft/Azure-Kinect-Sensor-SDK/blob/develop/docs/usage.md)
    - Firmware version: `1.6.110079014`
  - [Azure Kinect Body Tracking SDK v1.2.1](https://learn.microsoft.com/ja-jp/azure/Kinect-dk/body-sdk-download)
- [dvc](https://dvc.org/doc)

## Environmental Setup

```
choco install dvc
yarn
yarn run copy-dlls
```

### Release

```
yarn run release
```

## Tips

### How to update Kinect firmware

.\AzureKinectFirmwareTool.exe -u 'C:\Users\Yusuke KONDO\Downloads\AzureKinectDK_Fw_1.6.110079014.bin'

```
$ pwd

Path
----
C:\Program Files\Azure Kinect SDK v1.4.1\tools

$ .\AzureKinectFirmwareTool.exe -u 'C:\Users\Yusuke KONDO\Downloads\AzureKinectDK_Fw_1.6.110079014.bin'
1.6.110079014

$  == Azure Kinect DK Firmware Tool ==
Loading firmware package C:\Users\Yusuke KONDO\Downloads\AzureKinectDK_Fw_1.6.110079014.bin.
File size: 1294306 bytes
This package contains:
  RGB camera firmware:      1.6.110
  Depth camera firmware:    1.6.79
  Depth config files: 6109.7 5006.27
  Audio firmware:           1.6.14
  Build Config:             Production
  Certificate Type:         Microsoft
  Signature Type:           Microsoft

Device Serial Number: 000490121512
Current Firmware Versions:
  RGB camera firmware:      1.6.110
  Depth camera firmware:    1.6.79
  Depth config file:        6109.7
  Audio firmware:           1.6.14
  Build Config:             Production
  Certificate Type:         Microsoft

Please wait, updating device firmware. Don't unplug the device. This operation can take a few minutes...

Resetting Azure Kinect S/N: 000490121512
Waiting for reset of S/N: 000490121512 to complete.
Reset of S/N: 000490121512 completed successfully.

SUCCESS: The firmware was already up-to-date.
```

Then you can verify the firmware is working with `.\k4aviewer.exe`.

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

### Share training log via DVC

#### Download

```
git pull
dvc pull
```

#### Upload

```
dvc add <directory_name>
git commit
git push
dvc push
```
