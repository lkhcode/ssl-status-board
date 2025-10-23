[![CircleCI](https://circleci.com/gh/RoboCup-SSL/ssl-status-board/tree/master.svg?style=svg)](https://circleci.com/gh/RoboCup-SSL/ssl-status-board/tree/master)
[![Go Report Card](https://goreportcard.com/badge/github.com/lkhcode/ssl-status-board?style=flat-square)](https://goreportcard.com/report/github.com/lkhcode/ssl-status-board)
[![Go Doc](https://img.shields.io/badge/godoc-reference-blue.svg?style=flat-square)](https://godoc.org/github.com/lkhcode/ssl-status-board)
[![Release](https://img.shields.io/github/release/lkhcode/ssl-status-board.svg?style=flat-square)](https://github.com/RoboCup-SSL/ssl-status-board/releases/latest)
[![Coverage](https://img.shields.io/badge/coverage-report-blue.svg)](https://circleci.com/api/v1.1/project/github/lkhcode/ssl-status-board/latest/artifacts/0/coverage?branch=master)

# SSL Status Board

本项目Fork自[RoboCup-SSL/ssl-status-board](https://github.com/RoboCup-SSL/ssl-status-board)，这是一个用于Robocup小型组（Small Size League）的计分板，可以在大屏幕上展示当前比赛的状态。

本项目对计分板做出了以下修改：
1. 对计分板进行了汉化

> 汉化的措辞参考以下规则:
>
> [Robocup世界杯中国公开赛小型组规则](http://crc.drct-caa.org.cn/static/kindeditor/attached/file/20250207/20250207014751_79139.pdf)
>
> [浙江省大学生机器人竞赛小型足球机器人比赛规则](https://oss.moocollege.com/27757/edit/HIZ0s6JS_1742376586041.pdf)

2. 增加对`INDIRECT FREE KICK`指令显示的支持
3. 增加对以下事件处理的支持:
- `ATTACKER_TOUCHED_OPPONENT_IN_DEFENSE_AREA`   机器人在对方禁区触碰对方机器人
- `ATTACKER_TOUCHED_OPPONENT_IN_DEFENSE_AREA_SKIPPED`   机器人在对方禁区触碰对方机器人(忽略)
- `DEFENDER_IN_DEFENSE_AREA_PARTIALLY`  机器人部分进入对方禁区触球
4. 在Makefile中增加构建并生成二进制文件的指令
## 添加队伍
如果你想在计分板上显示队伍的LOGO，请将LOGO添加到 [frontend/src/assets/logos](frontend/src/assets/logos)，并在 [frontend/src/helpers/teamLogo.ts](frontend/src/helpers/teamLogo.ts) 中包含对应的条目。
队伍名称必须与 ssl-game-controller 中配置的名称完全一致，且使用小写。

## 使用
如果你只是想使用这个应用，直接下载最新的[Release二进制文件](https://github.com/lkhcode/ssl-status-board/releases/latest)即可。
二进制文件不需要额外依赖。

默认情况下，UI 可在 [http://localhost:8082](http://localhost:8082) 访问。

程序会在首次运行时生成一个配置文件 `config/board-config.yaml`，可以根据需要修改。

当没有活动时，可以在看板上显示一个网站（例如 Youtube）。传入类似下面的 URL 即可：
`http://localhost:8082?showVideoAfter=420&url=https://www.youtube.com/watch?v=-ELTaLJFBbo&list=PLQrim-8rpc7xWquV845w3ipiVfNB2Hsx4`

运行该程序时，可以在命令行携带参数：
- `-address string`

	用于 UI 和 API 监听的地址（默认运行在 ":8082"）
- `-refereeAddress string`

	ssl-game-controller 的多播地址（默认为`224.5.23.1:10003`）
- `-skipInterfaces string`

	接收多播数据包时需要忽略的网卡名称，使用逗号分隔

### 运行要求
 * 无运行时软件依赖（仅开发时需要安装依赖）
 * 64 位的 Linux、Windows 或 macOS（如需 32 位可自行编译）
 * 支持现代 Web 的浏览器（主要在 Chrome 上测试）
 
## 开发

### 依赖
在开始开发前请先安装以下依赖：

 * Go(ubuntu建议使用gvm安装)
 * Node(ubuntu建议使用nvm安装)

可在 [.circleci/config.yml](.circleci/config.yml) 中查看兼容的版本。

### 前端

参考 [frontend/README.md](frontend/README.md)

### 构建
安装环境：

```shell
make install
```

构建并生成二进制文件：

```shell
make build
```

### 运行
构建并运行主程序：

```shell
make run
```
