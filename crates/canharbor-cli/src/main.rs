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
    },
    Devices {
        #[arg(long)]
        json: bool,
    },
    Doctor,
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
    async fn open(
        &self,
        channel: &str,
        bitrate: u32,
        active: bool,
    ) -> Result<Value, Box<dyn std::error::Error>> {
        self.request("POST","/sessions",json!({"channel_id":channel,"config":{"mode":if active{"active"}else{"listen_only"},"nominal_bitrate":bitrate}}),None).await
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
    if let Command::Serve { open, no_web, port } = args.command {
        if open && no_web {
            return Err("--open conflicts with --no-web".into());
        }
        let server = RunningServer::start(
            Runtime::new(Arc::new(canharbor_virtual::VirtualBus::default())),
            &dir,
            port,
            !no_web,
        )
        .await?;
        eprintln!(
            "CANHarbor M0: simulated devices only. Local service ready{}",
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
        server.shutdown().await;
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
                        "{} (simulated)",
                        device["label"].as_str().unwrap_or("virtual")
                    );
                    for c in device["channels"].as_array().ok_or("invalid channels")? {
                        println!("  {}", c["id"].as_str().unwrap_or("unknown"));
                    }
                }
            }
        }
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
                    listen_only,
                },
        } => {
            if !listen_only {
                return Err(
                    "M0 session open requires --listen-only; use Web UI to select active mode"
                        .into(),
                );
            }
            print(client.open(&channel, bitrate, false).await?)
        }
        Command::Monitor {
            session,
            channel,
            bitrate,
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
                let s = client.open(&channel, bitrate, false).await?;
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
            let s = client.open(&channel, bitrate, true).await?;
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
        Command::Serve { .. } => unreachable!(),
    };
    Ok(())
}
