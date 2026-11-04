# CANHarbor

> An open CAN/CAN FD platform for macOS, built in Rust.

CANHarbor 计划提供 Rust SDK、`canharbor` CLI 和本地 Web UI，让 macOS 应用通过统一接口使用 CAN/CAN FD 适配器。首个硬件后端为 gs_usb，后续扩展 SLCAN、PEAK 和 Kvaser。

当前仓库处于技术设计阶段，尚无可运行的 SDK、命令或 Web UI。下列命令均为拟定接口。

```sh
canharbor serve --open
canharbor devices
canharbor session open --channel <channel-id> --bitrate 500000 --listen-only
canharbor monitor --session <session-id>
```

Web UI 由本地 Rust 服务提供；浏览器通过 HTTP API 和 WebSocket 访问设备，不直接操作 USB。正式发行目标是单个可执行文件，使用时不需要 Node.js。

## 技术方案

- [总体架构与 Rust 模块](docs/technical-design.md)
- [HTTP、WebSocket 与数据契约](docs/api-design.md)
- [Web UI 与本地访问边界](docs/web-ui.md)
- [实施顺序与验收条件](docs/roadmap.md)
- [许可证、源码来源与发布](docs/licensing.md)
- [设计决策记录](docs/adr/0001-local-service-and-web-ui.md)

## 范围

优先交付设备发现、Classic CAN / CAN FD 收发、监视、过滤、录制回放和错误诊断。CANHarbor 是用户态平台，不承诺 macOS 的 Linux SocketCAN 内核 ABI，也不提供硬实时发送保证。

## License

CANHarbor 新增的自有代码与文档采用 **AGPL-3.0-or-later**。完整条款见 [LICENSE](LICENSE)。第三方代码保留其原有许可、版权和声明；各依赖在实际引入前完成核查。

AGPL 允许商业使用，适用情形下须履行相应源码等义务。Web UI 将提供许可证与实际运行版本的源码入口，详见[许可设计](docs/licensing.md)。
