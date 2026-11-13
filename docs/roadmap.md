# CANHarbor 实施计划与验收

状态：规划文档。M0–M3 的多项产物已有实现，但各阶段出口条件中的实机验收均未完成；实际范围见 [status.md](status.md)。依赖顺序为 M0 → M1 → M2 → M3。按可验证的纵向能力交付，首个公开版本同时具备 CLI 和轻量 Web UI；完整诊断协议、复杂仪表盘和更多硬件不阻塞 v0.1。

## M0 设计落地与虚拟链路

产物：Cargo workspace、工具链与依赖 lockfile、帧模型、虚拟后端、服务骨架、CLI 与 Web 纵向原型、API schema。包名按总体设计固定，先注册 core / gsusb / virtual / server / cli，gsusb 允许仅包含待验证的独立原型，不能假报可用。

任务顺序：

1. 实现并测试 CanId、Classic/FD/RTR 不变量及错误模型。
2. 实现虚拟设备、通道、时钟与可重复故障注入。
3. 实现一个设备 actor、会话状态、租约/fencing 和有界分发。
4. 提供 UDS 客户端与 `serve`，实现浏览器配对、REST/WS。
5. Web UI 串起虚拟设备、监视、单帧发送及 gap 提示。
6. 用 nusb 验证一台 Classic 和一台 FD 设备的枚举、能力、端点、取消；记录最低 macOS 与工具链候选，不承诺尚未测的平台。

出口：虚拟链路可完整演示；权限失败不触碰后端；两个客户端抢占控制权结果确定；慢浏览器不阻塞采集；服务退出能停止任务。M0 的设备型号、固件版本和 USB trace 形成首份硬件记录，记录不包含未经许可的业务流量。

## M1 v0.1 gs_usb 与基本工作台

产物：gs_usb 后端、CLI 的 list/monitor/send、Web 基础页面、服务端录制下载、签名打包流程和许可材料。

首版 CLI 拟定命令：

```sh
# 前台运行服务；也可另开终端用 --no-web
canharbor serve --open
canharbor devices --json
canharbor doctor

# 创建 stopped 会话，供 Web 或 SDK 后续管理
canharbor session open --channel <channel-id> --bitrate 500000 --listen-only

# 自建只听会话并在前台持有/续租；Ctrl-C 后停止并关闭
canharbor monitor --channel <channel-id> --bitrate 500000 --listen-only

# 只观察已有运行会话，不获取控制权
canharbor monitor --session <session-id>

# 自建临时主动会话、续租、发送一次并等待后端可提供的结果，再关闭
canharbor send --channel <channel-id> --bitrate 500000 --id 123 --data 010203 --active

# 录制任务由服务保存；需要已有运行会话
canharbor capture start --session <session-id>
canharbor capture stop <capture-id>
canharbor web open
```

CLI `--id` 固定为无前缀十六进制，HTTP id 为十进制 JSON 整数；帮助必须明确，不能根据字符串猜进制。FD 通过明确 `--fd --data-bitrate ... --brs` 参数开启。`monitor --channel` 与 `send --channel` 都不能打开已被其他会话占用的通道。

跨进程默认不传递控制 lease。`session open` 不代表 CLI 后台持续控制；它只保留资源 60 秒。需要持续工作的 CLI 命令在前台续租，普通 CLI 观察者可附加到其会话。Web 控制者关闭页面后租约可能到期，因此“录制由服务执行”不等于浏览器退出后通道永远运行。以后可通过显式服务端任务委托扩展，首版不隐式授权。

CLI stdout 输出数据/JSON，stderr 输出诊断。约定退出码：0 成功、2 参数错误、3 服务未启动/不可访问、4 设备不存在/断开、5 占用/租约冲突、6 后端 I/O 或总线故障、7 发送结果未知、8 队列/磁盘/资源限额。SIGINT 的采集正常结束返回 0；发送过程中中断可能产生未知结果，应提示并用 7，不得自动重试。

出口：至少两个适配器之间 Classic 与 FD 双向收发，完整 DLC 组合、标准/扩展、RTR、BRS、只听、热插拔、bus-off、序号/时间质量和录制前缀可恢复。设备能力限制需记录，无法制造的错误用模拟测试补充并区分证据来源。

## M2 v0.2 工具兼容与持续任务

稳定 C ABI / Python 接口、周期发送、离线查看回放、主动回放。周期与回放任务全部在 Rust 执行，每任务有 owner、租约、上限、期限、取消和未知发送结果处理。

若要求浏览器退出后长期录制，需要新增显式的服务端任务委托与停止策略 ADR；不能简单关闭租约超时。API 和产品说明同步解释该权限的存续。

出口：C 程序与 Python 示例跑通；大文件回放有界；WS断线不会重复发帧；周期调度报告实测抖动；API schema/TS 类型无漂移。若推进 python-can backend，先验证当前插件契约与许可证。

## M3 v0.3 更多适配器与应用能力

根据实机资源选择 SLCAN、PEAK 或 Kvaser，先复用窄 C ABI，独立 Cargo feature。增加按需 DBC、ISO-TP、Cyphal 模块，避免全量引入协议与数据库资产。

出口：每个新增设备有来源审计、具体固件/系统矩阵、多通道并发测试及限制说明。PCAN-Basic 兼容作为独立子集，不覆盖系统已有 dylib，不以一个应用可运行推导全部 ABI 兼容。

## 测试与证据

每次相关变更运行 fmt、clippy、Rust 单元/集成测试、前端 typecheck/build、服务 API 契约与 Playwright 关键流程。许可证/漏洞与依赖来源策略加入 CI；API/WS fuzz、安全拒绝测试及状态机属性测试按代码边界触发。

硬件 soak：24 小时接收，持续负载、多通道、长时/空闲回绕、拔插、睡眠唤醒、bus-off 与磁盘故障。流量包含可检测缺失的序号，记录本机、USB hub、适配器/固件、位率、帧长度、测试时长与各层丢失。实机测试仅在明确标记的维护者环境运行，普通云端 CI 不接生产 CAN 网络。

支持状态分为“实现”“CI 编译”“模拟验证”“实机验证”；README 只声明达到对应验收的能力。初始性能基准以指定 Apple Silicon 机器为主，不预先承诺固定 USB 吞吐。

## 第一批可直接拆分的开发事项

- CH-001：workspace、锁文件、AGPL 标识与基础 CI。
- CH-002：帧构造器、DLC/ID/FD/RTR 属性测试。
- CH-003：虚拟后端、可控时钟和错误注入。
- CH-004：设备 actor、多通道路由与取消。
- CH-005：会话、控制租约和 fencing。
- CH-006：UDS 生命周期、同用户身份与 CLI 客户端。
- CH-007：HTTP 配对、CSRF、Origin/Host 与 WS 拒绝测试。
- CH-008：schema、TS 类型、批量事件和 gap。
- CH-009：Web 设备/监视/单帧发送纵向流程。
- CH-010：nusb 原型和 gs_usb 首个实机证据。
- CH-011：NDJSON 录制、磁盘错误与完整性。
- CH-012：静态资源打包、源码包、声明和 release manifest。

编号仅用于本地规划，尚未创建 GitHub issue。阶段耗时取决于可用硬件和维护者投入，以出口条件而非预估日期作为发布依据。
