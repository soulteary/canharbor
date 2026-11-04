// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_core::runtime::Runtime;
use canharbor_server::{
    dto::{FrameDto, FrameKind, StreamMessage},
    local::{RunningServer, default_runtime_dir, socket_path},
};
use clap::{Parser, Subcommand};
use futures_util::{SinkExt, StreamExt};
use serde_json::{Value, json};
use std::{path::PathBuf, sync::Arc, time::Duration};
use tokio_tungstenite::{
    client_async,
    tungstenite::{Message, client::IntoClientRequest},
};
use uuid::Uuid;
#[derive(Parser)]
#[command(
    name = "canharbor",
    version,
    about = "Local CAN/CAN FD workbench. M0 supports simulated devices only."
)]
struct Args {
    #[arg(long, global = true)]
    runtime_dir: Option<PathBuf>,
    #[command(subcommand)]
    command: Command,
}
#[derive(Subcommand)]
enum Command {
    Serve {
        #[arg(long)]
        open: bool,
        #[arg(long)]
        no_web: bool,
        #[arg(long, default_value_t = 0)]
        port: u16,
        #[arg(long,requires_all=["usb_index","usb_interface","usb_alternate"])]
        usb: Option<String>,
        #[arg(long, requires = "usb")]
        usb_index: Option<usize>,
        #[arg(long, requires = "usb")]
        usb_interface: Option<u8>,
        #[arg(long, requires = "usb")]
        usb_alternate: Option<u8>,
    },
    Devices {
        #[arg(long)]
        json: bool,
    },
    Doctor,
    Capabilities {
        #[arg(long)]
        channel: String,
    },
    UsbList {
        #[arg(long)]
        vid_pid: String,
    },
    Web {
        #[command(subcommand)]
        command: WebCommand,
    },
    Session {
        #[command(subcommand)]
        command: SessionCommand,
    },
    Monitor {
        #[arg(long, conflicts_with = "channel")]
        session: Option<String>,
        #[arg(long, conflicts_with = "session")]
        channel: Option<String>,
        #[arg(long, default_value_t = 500000)]
        bitrate: u32,
        #[arg(long)]
        fd: bool,
        #[arg(long, requires = "fd")]
        data_bitrate: Option<u32>,
        #[arg(long)]
        listen_only: bool,
        #[arg(long)]
        count: Option<usize>,
    },
    Send {
        #[arg(long)]
        channel: String,
        #[arg(long)]
        id: String,
        #[arg(long, default_value = "")]
        data: String,
        #[arg(long)]
        extended: bool,
        #[arg(long)]
        fd: bool,
        #[arg(long, requires = "fd")]
        data_bitrate: Option<u32>,
        #[arg(long)]
        brs: bool,
        #[arg(long)]
        active: bool,
        #[arg(long, default_value_t = 500000)]
        bitrate: u32,
    },
}
#[derive(Subcommand)]
enum WebCommand {
    Open {
        #[arg(long)]
        print: bool,
    },
}
#[derive(Subcommand)]
enum SessionCommand {
    List,
    Open {
        #[arg(long)]
        channel: String,
        #[arg(long, default_value_t = 500000)]
        bitrate: u32,
        #[arg(long)]
        fd: bool,
        #[arg(long, requires = "fd")]
        data_bitrate: Option<u32>,
        #[arg(long)]
        listen_only: bool,
    },
}
struct Client {
    http: reqwest::Client,
    id: String,
    dir: PathBuf,
}
impl Client {
    fn new(dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            http: reqwest::Client::builder()
                .no_proxy()
                .unix_socket(socket_path(&dir))
                .timeout(Duration::from_secs(10))
                .build()?,
            id: Uuid::new_v4().to_string(),
            dir,
        })
    }
    async fn request(
        &self,
        method: &str,
        path: &str,
        body: Value,
        g: Option<&str>,
    ) -> Result<Value, Box<dyn std::error::Error>> {
        let mut req = self
            .http
            .request(method.parse()?, format!("http://localhost/api/v1{path}"))
            .header("x-canharbor-client", &self.id)
            .json(&body);
        if let Some(g) = g {
            req = req.header("x-canharbor-lease-generation", g)
        }
        let response = req.send().await.map_err(|e| {
            format!("cannot contact local service; run `canharbor serve` first: {e}")
        })?;
        let status = response.status();
        if status == reqwest::StatusCode::NO_CONTENT {
            return Ok(Value::Null);
        }
        let value: Value = response.json().await?;
        if !status.is_success() {
            return Err(format!("{}: {}", status, value).into());
        }
        Ok(value)
    }
    async fn open_with_data(
        &self,
        channel: &str,
        bitrate: u32,
        active: bool,
        data_bitrate: Option<u32>,
    ) -> Result<Value, Box<dyn std::error::Error>> {
        self.request("POST","/sessions",json!({"channel_id":channel,"config":{"mode":if active{"active"}else{"listen_only"},"nominal_bitrate":bitrate,"fd":data_bitrate.map(|rate|json!({"enabled":true,"data_bitrate":rate,"iso":true}))}}),None).await
    }

    async fn control(&self, id: &str) -> Result<String, Box<dyn std::error::Error>> {
        let v = self
            .request("POST", &format!("/sessions/{id}/lease"), json!({}), None)
            .await?;
        Ok(v["generation"]
            .as_str()
            .ok_or("invalid lease response")?
            .into())
    }
    async fn stream(
        &self,
        session: &str,
        count: Option<usize>,
        lease: Option<&str>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let stream = tokio::net::UnixStream::connect(socket_path(&self.dir)).await?;
        let mut req =
            format!("ws://localhost/api/v1/sessions/{session}/stream").into_client_request()?;
        req.headers_mut()
            .insert("x-canharbor-client", self.id.parse()?);
        let (mut ws, _) = client_async(req, stream).await?;
        ws.send(Message::Text(
            json!({"type":"subscribe","protocol_version":"1.0","filter":{}})
                .to_string()
                .into(),
        ))
        .await?;
        let mut renew = tokio::time::interval(Duration::from_secs(5));
        let mut seen = 0;
        loop {
            tokio::select! {
            _=tokio::signal::ctrl_c()=>break,
            _=renew.tick(),if lease.is_some()=>{self.request("POST",&format!("/sessions/{session}/lease/renew"),json!({}),lease).await?;},
            next=ws.next()=>{match next{Some(Ok(Message::Text(t)))=>{let message:StreamMessage=serde_json::from_str(&t)?;
                match message {
                    StreamMessage::Events{events,..} => { for event in events { println!("{}",serde_json::to_string(&event)?);seen+=1;if count.is_some_and(|c|seen>=c){ws.close(None).await?;return Ok(())} } }
                    message @ StreamMessage::Gap{..} => eprintln!("stream gap: {}",serde_json::to_string(&message)?),
                    message @ StreamMessage::SessionFault{..} => return Err(format!("channel fault: {}",serde_json::to_string(&message)?).into()),
                    StreamMessage::ResumeUnavailable => return Err("stream history is unavailable".into()),
                    // Hello confirms the server has installed the subscription.
                    StreamMessage::Hello{..} => {
                        if let Some(g) = lease {
                            self.request("POST", &format!("/sessions/{session}/start"), json!({}), Some(g)).await?;
                        }
                    },
                }},Some(Ok(Message::Ping(p)))=>ws.send(Message::Pong(p)).await?,Some(Ok(Message::Close(_)))|None=>return Err("event stream closed; no automatic resume".into()),Some(Err(e))=>return Err(e.into()),_=>{}}}
            }
        }
        ws.close(None).await?;
        Ok(())
    }
}
fn print(value: Value) {
    println!("{}", serde_json::to_string_pretty(&value).unwrap())
}
fn browser(url: &str) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "macos")]
    let status = std::process::Command::new("open").arg(url).status()?;
    #[cfg(not(target_os = "macos"))]
    let status = std::process::Command::new("xdg-open").arg(url).status()?;
    if !status.success() {
        return Err("could not open browser; use `canharbor web open --print`".into());
    }
    Ok(())
}
#[tokio::main]
async fn main() {
    if let Err(e) = run().await {
        eprintln!("{e}");
        std::process::exit(1)
    }
}
async fn run() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();
    let dir = args.runtime_dir.unwrap_or_else(default_runtime_dir);
    if let Command::Serve {
        open,
        no_web,
        port,
        usb,
        usb_index,
        usb_interface,
        usb_alternate,
    } = args.command
    {
        if open && no_web {
            return Err("--open conflicts with --no-web".into());
        }
        let mut backends: Vec<Arc<dyn canharbor_core::Backend>> =
            vec![Arc::new(canharbor_virtual::VirtualBus::default())];
        if let Some(vid_pid) = usb {
            let id = parse_vid_pid(&vid_pid)?;
            let transport = tokio::task::spawn_blocking(move || {
                let candidates = canharbor_gsusb::usb::discover(&[id])?;
                let candidate = candidates
                    .into_iter()
                    .nth(usb_index.unwrap())
                    .ok_or(canharbor_gsusb::Error::Protocol("USB candidate index"))?;
                candidate.open(usb_interface.unwrap(), usb_alternate.unwrap())
            })
            .await??;
            backends.push(Arc::new(
                canharbor_gsusb::backend::GsUsbBackend::open(
                    transport,
                    u16::from(usb_interface.unwrap()),
                    Uuid::new_v4().simple().to_string(),
                )
                .await?,
            ));
        }
        let server = RunningServer::start(
            Runtime::new(Arc::new(canharbor_core::registry::Registry::new(backends)?)),
            &dir,
            port,
            !no_web,
        )
        .await?;
        eprintln!(
            "CANHarbor: local service ready{}",
            if no_web {
                String::new()
            } else {
                format!(" at {}", server.state.origin)
            }
        );
        if open {
            let client = Client::new(dir.clone())?;
            let v = client
                .request("POST", "/native/pair", json!({}), None)
                .await?;
            if let Err(e) = browser(v["url"].as_str().ok_or("invalid pairing response")?) {
                eprintln!("{e}")
            }
        }
        tokio::signal::ctrl_c().await?;
        let report = server.shutdown().await;
        if report.unknown_transmissions > 0 {
            eprintln!(
                "{} transmissions have unknown outcomes",
                report.unknown_transmissions
            );
        }
        if !report.failures.is_empty() {
            for failure in report.failures {
                eprintln!("shutdown: {failure}");
            }
            return Err("service shutdown incomplete".into());
        }
        return Ok(());
    }
    let client = Client::new(dir)?;
    match args.command {
        Command::Devices { json: as_json } => {
            let value = client.request("GET", "/devices", Value::Null, None).await?;
            if as_json {
                print(value)
            } else {
                for device in value["devices"].as_array().ok_or("invalid devices")? {
                    println!(
                        "{} ({})",
                        device["label"].as_str().unwrap_or("CAN device"),
                        if device["simulated"].as_bool() == Some(true) {
                            "simulated"
                        } else {
                            "hardware, unverified"
                        }
                    );
                    for c in device["channels"].as_array().ok_or("invalid channels")? {
                        println!("  {}", c["id"].as_str().unwrap_or("unknown"));
                    }
                }
            }
        }
        Command::Capabilities { channel } => print(
            client
                .request(
                    "GET",
                    &format!("/channels/{channel}/capabilities"),
                    Value::Null,
                    None,
                )
                .await?,
        ),
        Command::Doctor => print(
            client
                .request("GET", "/diagnostics", Value::Null, None)
                .await?,
        ),
        Command::Web {
            command: WebCommand::Open { print: as_text },
        } => {
            let v = client
                .request("POST", "/native/pair", json!({}), None)
                .await?;
            let url = v["url"].as_str().ok_or("invalid pair URL")?;
            if as_text {
                println!("{url}")
            } else {
                browser(url)?
            }
        }
        Command::Session {
            command: SessionCommand::List,
        } => print(
            client
                .request("GET", "/sessions", Value::Null, None)
                .await?,
        ),
        Command::Session {
            command:
                SessionCommand::Open {
                    channel,
                    bitrate,
                    fd,
                    data_bitrate,
                    listen_only,
                },
        } => {
            if !listen_only {
                return Err(
                    "M0 session open requires --listen-only; use Web UI to select active mode"
                        .into(),
                );
            }
            print(
                client
                    .open_with_data(
                        &channel,
                        bitrate,
                        false,
                        fd.then_some(data_bitrate.unwrap_or(2_000_000)),
                    )
                    .await?,
            )
        }
        Command::Monitor {
            session,
            channel,
            bitrate,
            fd,
            data_bitrate,
            listen_only,
            count,
        } => {
            if count == Some(0) {
                return Err("--count must be positive".into());
            }
            if let Some(id) = session {
                client.stream(&id, count, None).await?
            } else {
                if !listen_only {
                    return Err("channel monitor requires --listen-only".into());
                }
                let channel = channel.ok_or("provide --session or --channel")?;
                let s = client
                    .open_with_data(
                        &channel,
                        bitrate,
                        false,
                        fd.then_some(data_bitrate.unwrap_or(2_000_000)),
                    )
                    .await?;
                let id = s["id"].as_str().ok_or("invalid session")?;
                let g = client.control(id).await?;
                let result = client.stream(id, count, Some(&g)).await;
                let _ = client
                    .request("DELETE", &format!("/sessions/{id}"), json!({}), Some(&g))
                    .await;
                result?
            }
        }
        Command::Send {
            channel,
            id,
            data,
            extended,
            fd,
            data_bitrate,
            brs,
            active,
            bitrate,
        } => {
            if !active {
                return Err("sending requires explicit --active".into());
            }
            let id = u32::from_str_radix(&id, 16)
                .map_err(|_| "--id must be hexadecimal without a prefix")?;
            let dto = FrameDto {
                kind: if fd {
                    FrameKind::FdData
                } else {
                    FrameKind::ClassicData
                },
                id,
                extended,
                brs,
                data_hex: data,
                dlc: None,
            };
            dto.clone()
                .into_frame()
                .map_err(|e| format!("invalid frame: {e}"))?;
            let s = client
                .open_with_data(
                    &channel,
                    bitrate,
                    true,
                    fd.then_some(data_bitrate.unwrap_or(2_000_000)),
                )
                .await?;
            let sid = s["id"].as_str().ok_or("invalid session")?;
            let g = client.control(sid).await?;
            let result = async {
                client
                    .request(
                        "POST",
                        &format!("/sessions/{sid}/start"),
                        json!({}),
                        Some(&g),
                    )
                    .await?;
                client
                    .request(
                        "POST",
                        &format!("/sessions/{sid}/tx"),
                        json!({"client_request_id":Uuid::new_v4().to_string(),"frame":dto}),
                        Some(&g),
                    )
                    .await
            }
            .await;
            let _ = client
                .request("DELETE", &format!("/sessions/{sid}"), json!({}), Some(&g))
                .await;
            print(result?)
        }
        Command::UsbList { vid_pid } => {
            let id = parse_vid_pid(&vid_pid)?;
            let candidates =
                tokio::task::spawn_blocking(move || canharbor_gsusb::usb::discover(&[id]))
                    .await??;
            print(
                json!({"candidates":candidates.iter().enumerate().map(|(index,c)|json!({"index":index,"vendor_id":c.id().vendor,"product_id":c.id().product,"has_serial":c.serial().is_some()})).collect::<Vec<_>>()}),
            );
        }
        Command::Serve { .. } => unreachable!(),
    };
    Ok(())
}

fn parse_vid_pid(value: &str) -> Result<canharbor_gsusb::usb::VidPid, Box<dyn std::error::Error>> {
    let (vendor, product) = value
        .split_once(':')
        .ok_or("VID:PID must contain four hex digits per component")?;
    if vendor.len() != 4
        || product.len() != 4
        || !vendor
            .bytes()
            .chain(product.bytes())
            .all(|b| b.is_ascii_hexdigit())
    {
        return Err("VID:PID must contain four hex digits per component".into());
    }
    Ok(canharbor_gsusb::usb::VidPid {
        vendor: u16::from_str_radix(vendor, 16)?,
        product: u16::from_str_radix(product, 16)?,
    })
}

#[cfg(test)]
mod selection_tests {
    use super::*;
    #[test]
    fn usb_open_requires_all_explicit_selection_fields() {
        assert!(Args::try_parse_from(["canharbor", "serve", "--usb", "1d50:606f"]).is_err());
        assert!(Args::try_parse_from(["canharbor", "serve", "--usb-index", "0"]).is_err());
        assert!(
            Args::try_parse_from([
                "canharbor",
                "serve",
                "--usb",
                "1d50:606f",
                "--usb-index",
                "0",
                "--usb-interface",
                "0",
                "--usb-alternate",
                "0"
            ])
            .is_ok()
        );
    }
    #[test]
    fn usb_ids_and_fd_arguments_are_unambiguous() {
        assert!(parse_vid_pid("1d50:606f").is_ok());
        for bad in ["1:2", "0x1d50:606f", "1d50:606f:0", "ZZZZ:0000"] {
            assert!(parse_vid_pid(bad).is_err());
        }
        assert!(
            Args::try_parse_from([
                "canharbor",
                "send",
                "--channel",
                "virtual:0",
                "--id",
                "123",
                "--data-bitrate",
                "2000000"
            ])
            .is_err()
        );
    }
}
