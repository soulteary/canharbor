// SPDX-License-Identifier: AGPL-3.0-or-later
//! Bounded read-only workers; no event callback crosses the ABI.
use super::*;
use canharbor_client::api;
use tokio::sync::{Notify, mpsc as channel};
const AGAIN: i32 = 10;
struct Read {
    until: Instant,
    reply: mpsc::SyncSender<Reply>,
}
pub(super) struct Handle {
    pub parent: u64,
    sender: channel::Sender<Read>,
    closing: Arc<Notify>,
    closed: Arc<AtomicBool>,
    reading: AtomicBool,
}
impl Handle {
    pub fn stop(&self) {
        self.closed.store(true, Ordering::Release);
        self.closing.notify_one();
    }
}
impl Drop for Handle {
    fn drop(&mut self) {
        self.stop();
    }
}
fn error_status(error: &(dyn std::error::Error + 'static)) -> i32 {
    if let Some(api) = error.downcast_ref::<ApiFailure>() {
        return match api.status {
            404 => NOT_FOUND,
            409 | 412 => CONFLICT,
            429 | 507 => LIMIT,
            400 | 401 | 403 | 422 | 428 => INVALID,
            _ => IO,
        };
    }
    if error.is::<canharbor_client::StreamUnavailable>() {
        UNAVAILABLE
    } else if error.is::<canharbor_client::InvalidArgument>() {
        INVALID
    } else if error.is::<canharbor_client::ResourceLimit>() {
        LIMIT
    } else {
        IO
    }
}
fn finish_reads(receiver: &mut channel::Receiver<Read>) {
    receiver.close();
    while let Ok(read) = receiver.try_recv() {
        let _ = read
            .reply
            .send(failure(NOT_FOUND, "event subscription closed"));
    }
}
fn spawn_observer(
    parent: u64,
    client: LocalClient,
    session: String,
    subscription: api::Subscribe,
) -> Result<Arc<Handle>, i32> {
    let (sender, mut receiver) = channel::channel::<Read>(1);
    let closing = Arc::new(Notify::new());
    let closed = Arc::new(AtomicBool::new(false));
    let stop = closing.clone();
    let stopped = closed.clone();
    let (ready, opened) = mpsc::sync_channel(1);
    std::thread::Builder::new()
        .name("canharbor-c-stream".into())
        .spawn(move || {
            let runtime = match tokio::runtime::Builder::new_current_thread().enable_all().build() {
                Ok(runtime) => runtime,
                Err(_) => { let _ = ready.send(Err(INTERNAL)); return; }
            };
            runtime.block_on(async move {
                let mut stream = match client.subscribe(&session, &subscription).await {
                    Ok(stream) => stream,
                    Err(error) => { let _ = ready.send(Err(error_status(error.as_ref()))); return; }
                };
                if ready.send(Ok(())).is_err() { let _ = stream.close().await; return; }
                loop {
                    let read = tokio::select! {
                        biased;
                        _ = stop.notified() => break,
                        read = receiver.recv() => match read { Some(read) => read, None => break },
                    };
                    let reply = tokio::select! {
                        biased;
                        _ = stop.notified() => {
                            let _ = read.reply.send(failure(NOT_FOUND, "event subscription closed"));
                            break;
                        },
                        result = tokio::time::timeout_at(tokio::time::Instant::from_std(read.until), stream.next()) => match result {
                            Err(_) => Reply { status: AGAIN, bytes: vec![] },
                            Ok(Ok(Some(message))) => Reply { status: OK, bytes: serde_json::to_vec(&message).unwrap() },
                            Ok(Ok(None)) => failure(NOT_FOUND, "event stream ended; no automatic reconnect"),
                            Ok(Err(error)) => failure(error_status(error.as_ref()), &error.to_string()),
                        },
                    };
                    let terminal = reply.status != OK && reply.status != AGAIN;
                    let _ = read.reply.send(reply);
                    if terminal { break; }
                }
                finish_reads(&mut receiver);
                stopped.store(true, Ordering::Release);
                let _ = stream.close().await;
            });
        }).map_err(|_| INTERNAL)?;
    opened
        .recv_timeout(Duration::from_secs(11))
        .map_err(|_| UNAVAILABLE)??;
    Ok(Arc::new(Handle {
        parent,
        sender,
        closing,
        closed,
        reading: AtomicBool::new(false),
    }))
}
/// # Safety
/// Inputs must address readable UTF-8 bytes; output must address disjoint writable u64 storage.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn canharbor_stream_open(
    client: u64,
    session: *const u8,
    session_length: usize,
    subscription: *const u8,
    subscription_length: usize,
    output: *mut u64,
) -> i32 {
    boundary(|| {
        if output.is_null() {
            return Err(INVALID);
        }
        // SAFETY: caller supplies writable output and readable bounded inputs.
        unsafe { output.write(0) };
        let session = unsafe { input(session, session_length, 128)? };
        let subscription: api::Subscribe =
            serde_json::from_str(&unsafe { input(subscription, subscription_length, 16384)? })
                .map_err(|_| INVALID)?;
        let (id, local) = {
            let mut r = registry().lock().map_err(|_| INTERNAL)?;
            let local = r.clients.get(&client).ok_or(NOT_FOUND)?.local.clone();
            if r.streams.len() >= 16 {
                return Err(LIMIT);
            }
            let id = next(&mut r)?;
            r.streams.insert(id, None);
            (id, local)
        };
        let result = spawn_observer(client, local, session, subscription);
        let mut r = registry().lock().map_err(|_| INTERNAL)?;
        match result {
            Ok(stream) if r.clients.contains_key(&client) => {
                r.streams.insert(id, Some(stream));
            }
            Ok(_) => {
                r.streams.remove(&id);
                return Err(NOT_FOUND);
            }
            Err(error) => {
                r.streams.remove(&id);
                return Err(error);
            }
        }
        // SAFETY: required output remains writable for this call.
        unsafe { output.write(id) };
        Ok(())
    })
}
/// # Safety
/// output must address writable u64 storage valid throughout the call.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn canharbor_stream_next(
    stream: u64,
    timeout_ms: u32,
    output: *mut u64,
) -> i32 {
    boundary(|| {
        if output.is_null() {
            return Err(INVALID);
        }
        // SAFETY: required writable output.
        unsafe { output.write(0) };
        if !(1..=1000).contains(&timeout_ms) {
            return Err(INVALID);
        }
        let (handle, id) = {
            let mut r = registry().lock().map_err(|_| INTERNAL)?;
            let handle = r
                .streams
                .get(&stream)
                .and_then(Option::as_ref)
                .cloned()
                .ok_or(NOT_FOUND)?;
            if handle.closed.load(Ordering::Acquire) {
                return Err(NOT_FOUND);
            }
            if r.responses.len() >= 64 {
                return Err(LIMIT);
            }
            if handle
                .reading
                .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
                .is_err()
            {
                return Err(CONFLICT);
            }
            let id = match next(&mut r) {
                Ok(id) => id,
                Err(code) => {
                    handle.reading.store(false, Ordering::Release);
                    return Err(code);
                }
            };
            r.responses.insert(id, None);
            (handle, id)
        };
        struct Guard(Arc<Handle>);
        impl Drop for Guard {
            fn drop(&mut self) {
                self.0.reading.store(false, Ordering::Release);
            }
        }
        let guard = Guard(handle);
        let (sender, receiver) = mpsc::sync_channel(1);
        let reply = if guard
            .0
            .sender
            .try_send(Read {
                until: Instant::now() + Duration::from_millis(timeout_ms.into()),
                reply: sender,
            })
            .is_err()
        {
            failure(NOT_FOUND, "subscription worker ended")
        } else {
            receiver
                .recv_timeout(Duration::from_millis(u64::from(timeout_ms) + 2000))
                .unwrap_or_else(|_| {
                    guard.0.stop();
                    failure(UNAVAILABLE, "event read deadline exceeded")
                })
        };
        let mut r = registry().lock().map_err(|_| INTERNAL)?;
        if reply.status == AGAIN {
            r.responses.remove(&id);
            return Err(AGAIN);
        }
        r.responses.insert(id, Some(reply));
        // SAFETY: required output remains writable.
        unsafe { output.write(id) };
        Ok(())
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn canharbor_stream_close(stream: u64) -> i32 {
    boundary(|| {
        let handle = registry()
            .lock()
            .map_err(|_| INTERNAL)?
            .streams
            .remove(&stream)
            .and_then(|s| s)
            .ok_or(NOT_FOUND)?;
        handle.stop();
        Ok(())
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn closing_completes_a_read_queued_before_worker_selection() {
        let (sender, mut receiver) = channel::channel(1);
        let (reply, received) = mpsc::sync_channel(1);
        sender
            .try_send(Read {
                until: Instant::now() + Duration::from_secs(1),
                reply,
            })
            .unwrap();
        finish_reads(&mut receiver);
        let result = received.recv_timeout(Duration::from_millis(100)).unwrap();
        assert_eq!(result.status, NOT_FOUND);
        assert!(
            String::from_utf8(result.bytes)
                .unwrap()
                .contains("subscription closed")
        );
        assert!(sender.is_closed());
    }
}
