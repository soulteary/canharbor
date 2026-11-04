// SPDX-License-Identifier: AGPL-3.0-or-later
//! Bounded NDJSON capture writing and streaming prefix validation.
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    io::{self, BufRead, BufReader, Read, Write},
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, AtomicU64, Ordering},
        mpsc::{self, SyncSender, TrySendError},
    },
    thread,
};
pub const MAX_LINE: usize = 8192;
pub const MAX_FILE: u64 = 64 * 1024 * 1024;
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("capture I/O failed: {0}")]
    Io(#[from] io::Error),
    #[error("capture record rejected: {0}")]
    Invalid(&'static str),
    #[error("capture queue is full")]
    QueueFull,
    #[error("capture writer is closed")]
    Closed,
    #[error("capture JSON failed: {0}")]
    Json(#[from] serde_json::Error),
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Reason {
    QueueFull,
    SourceGap,
    SizeLimit,
    IoError,
    DiskFull,
    OwnerDropped,
    SessionStopped,
    InvalidEvent,
    DurationLimit,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Header {
    pub capture_id: String,
    pub owner: String,
    pub server_instance_id: String,
    pub session_epoch: String,
    pub created_unix_ms: String,
    pub config: Value,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "record", rename_all = "snake_case")]
pub enum Record {
    Header {
        schema_version: u32,
        #[serde(flatten)]
        metadata: Header,
    },
    Event {
        event: Value,
    },
    Gap {
        cause: Reason,
        count: Option<String>,
    },
    Footer {
        complete: bool,
        events: String,
        dropped: String,
        reason: Option<Reason>,
    },
}
#[derive(Debug, Clone)]
pub struct Report {
    pub complete: bool,
    pub events: u64,
    pub dropped: u64,
    pub bytes: u64,
    pub reason: Option<Reason>,
    pub unknown_loss: bool,
}
#[derive(Debug, Clone, Copy)]
pub struct Options {
    pub queue: usize,
    pub max_bytes: u64,
    pub flush_every: usize,
}
impl Default for Options {
    fn default() -> Self {
        Self {
            queue: 64,
            max_bytes: MAX_FILE,
            flush_every: 32,
        }
    }
}
struct Shared {
    closed: AtomicBool,
    finalized: AtomicBool,
    reason: Mutex<Option<Reason>>,
    dropped: AtomicU64,
    unknown_loss: AtomicBool,
    bytes: AtomicU64,
    events: AtomicU64,
}
impl Shared {
    fn add_dropped(&self, count: u64) {
        let old = self
            .dropped
            .try_update(Ordering::AcqRel, Ordering::Acquire, |old| {
                Some(old.saturating_add(count))
            })
            .unwrap();
        if old.checked_add(count).is_none() {
            self.unknown_loss.store(true, Ordering::Release);
        }
    }
    fn incomplete(&self, reason: Reason, dropped: u64) {
        let mut current = self.reason.lock().unwrap();
        if self.finalized.load(Ordering::Acquire)
            && !matches!(reason, Reason::IoError | Reason::DiskFull)
        {
            return;
        }
        if current.is_none() || matches!(reason, Reason::IoError | Reason::DiskFull) {
            *current = Some(reason);
        }
        if reason == Reason::SourceGap && dropped == 0 {
            self.unknown_loss.store(true, Ordering::Release);
        }
        self.add_dropped(dropped);
        self.closed.store(true, Ordering::Release);
    }
}
struct Counted<W> {
    sink: W,
    shared: Arc<Shared>,
}
impl<W: Write> Write for Counted<W> {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        let n = self.sink.write(bytes)?;
        self.shared.bytes.fetch_add(n as u64, Ordering::Relaxed);
        Ok(n)
    }
    fn flush(&mut self) -> io::Result<()> {
        self.sink.flush()
    }
}
fn io_reason(error: &io::Error) -> Reason {
    if error.kind() == io::ErrorKind::StorageFull {
        Reason::DiskFull
    } else {
        Reason::IoError
    }
}
fn line(record: &Record) -> Result<Vec<u8>, Error> {
    let mut bytes = serde_json::to_vec(record)?;
    // Enforce the same nesting limit used by the reader before any sink I/O.
    serde_json::from_slice::<Record>(&bytes)?;
    bytes.push(b'\n');
    if bytes.len() > MAX_LINE {
        return Err(Error::Invalid("record too large"));
    }
    Ok(bytes)
}
pub struct Writer {
    sender: Option<SyncSender<Vec<u8>>>,
    join: Option<thread::JoinHandle<Report>>,
    shared: Arc<Shared>,
}
impl Writer {
    /// Blocking initialization and join belong on a dedicated or blocking worker.
    pub fn start<W: Write + Send + 'static>(
        sink: W,
        header: Header,
        options: Options,
    ) -> Result<Self, Error> {
        if options.queue == 0
            || options.queue > 256
            || options.max_bytes > MAX_FILE
            || options.max_bytes < 3 * MAX_LINE as u64
            || options.flush_every == 0
            || options.flush_every > 256
        {
            return Err(Error::Invalid("writer limits"));
        }
        canonical(&header.created_unix_ms)?;
        let header = line(&Record::Header {
            schema_version: 1,
            metadata: header,
        })?;
        let shared = Arc::new(Shared {
            closed: AtomicBool::new(false),
            finalized: AtomicBool::new(false),
            reason: Mutex::new(None),
            dropped: AtomicU64::new(0),
            unknown_loss: AtomicBool::new(false),
            bytes: AtomicU64::new(0),
            events: AtomicU64::new(0),
        });
        let (sender, receiver) = mpsc::sync_channel::<Vec<u8>>(options.queue);
        let (ready_tx, ready_rx) = mpsc::sync_channel(1);
        let state = shared.clone();
        let join = thread::Builder::new()
            .name("canharbor-capture".into())
            .spawn(move || {
                let mut writer = Counted {
                    sink,
                    shared: state.clone(),
                };
                let mut events = 0u64;
                let mut logical = header.len() as u64;
                let initialized = writer.write_all(&header).and_then(|_| writer.flush());
                if let Err(error) = &initialized {
                    state.incomplete(io_reason(error), 0);
                }
                let _ = ready_tx.send(initialized.map_err(Error::Io));
                if state.reason.lock().unwrap().is_none() {
                    while let Ok(bytes) = receiver.recv() {
                        // Reserve space for the bounded gap/footer control records.
                        if logical.saturating_add(bytes.len() as u64) + 2 * MAX_LINE as u64
                            > options.max_bytes
                        {
                            state.incomplete(Reason::SizeLimit, 1);
                            break;
                        }
                        if let Err(error) = writer.write_all(&bytes) {
                            state.incomplete(io_reason(&error), 1);
                            break;
                        }
                        logical += bytes.len() as u64;
                        events += 1;
                        state.events.store(events, Ordering::Release);
                        if events.is_multiple_of(options.flush_every as u64)
                            && let Err(error) = writer.flush()
                        {
                            state.incomplete(io_reason(&error), 0);
                            break;
                        }
                    }
                }
                if state.closed.load(Ordering::Acquire) {
                    state.add_dropped(receiver.try_iter().count() as u64);
                }
                // Seal accounting under the same lock used by terminal transitions.
                // Sink I/O happens after releasing it so a blocked disk never blocks producers.
                let (reason, dropped, unknown_loss) = {
                    let guard = state.reason.lock().unwrap();
                    state.finalized.store(true, Ordering::Release);
                    (
                        *guard,
                        state.dropped.load(Ordering::Acquire),
                        state.unknown_loss.load(Ordering::Acquire),
                    )
                };
                if !matches!(reason, Some(Reason::IoError | Reason::DiskFull)) {
                    let finalized = (|| -> io::Result<()> {
                        if let Some(cause) = reason {
                            let gap = line(&Record::Gap {
                                cause,
                                count: (!unknown_loss).then(|| dropped.to_string()),
                            })
                            .expect("bounded control record");
                            writer.write_all(&gap)?;
                            if unknown_loss && dropped > 0 {
                                let gap = line(&Record::Gap {
                                    cause: Reason::SourceGap,
                                    count: Some(dropped.to_string()),
                                })
                                .expect("bounded control record");
                                writer.write_all(&gap)?;
                            }
                        }
                        let footer = line(&Record::Footer {
                            complete: reason.is_none(),
                            events: events.to_string(),
                            dropped: dropped.to_string(),
                            reason,
                        })
                        .expect("bounded control record");
                        writer.write_all(&footer)?;
                        writer.flush()
                    })();
                    if let Err(error) = finalized {
                        state.incomplete(io_reason(&error), 0);
                    }
                }
                // No user-space write buffer retries data implicitly on drop.
                drop(writer);
                let reason = *state.reason.lock().unwrap();
                Report {
                    complete: reason.is_none(),
                    events,
                    dropped: state.dropped.load(Ordering::Acquire),
                    bytes: state.bytes.load(Ordering::Acquire),
                    reason,
                    unknown_loss: state.unknown_loss.load(Ordering::Acquire),
                }
            })?;
        ready_rx.recv().map_err(|_| Error::Closed)??;
        Ok(Self {
            sender: Some(sender),
            join: Some(join),
            shared,
        })
    }
    pub fn event(&self, event: Value) -> Result<(), Error> {
        let bytes = match line(&Record::Event { event }) {
            Ok(bytes) => bytes,
            Err(error) => {
                self.shared.incomplete(Reason::InvalidEvent, 1);
                return Err(error);
            }
        };
        // Serialize enqueue against terminal transitions so every accepted but
        // unwritten record can be counted when the worker drains the queue.
        let mut reason = self.shared.reason.lock().unwrap();
        if self.shared.closed.load(Ordering::Acquire) {
            return Err(Error::Closed);
        }
        match self.sender.as_ref().ok_or(Error::Closed)?.try_send(bytes) {
            Ok(()) => Ok(()),
            Err(TrySendError::Full(_)) => {
                *reason = Some(Reason::QueueFull);
                self.shared.add_dropped(1);
                self.shared.closed.store(true, Ordering::Release);
                Err(Error::QueueFull)
            }
            Err(TrySendError::Disconnected(_)) => Err(Error::Closed),
        }
    }
    pub fn progress(&self) -> Report {
        Report {
            complete: false,
            events: self.shared.events.load(Ordering::Acquire),
            dropped: self.shared.dropped.load(Ordering::Acquire),
            bytes: self.shared.bytes.load(Ordering::Acquire),
            reason: *self.shared.reason.lock().unwrap(),
            unknown_loss: self.shared.unknown_loss.load(Ordering::Acquire),
        }
    }
    pub fn incomplete(&self, reason: Reason, dropped: u64) {
        self.shared.incomplete(reason, dropped);
    }
    pub fn finish(mut self) -> Result<Report, Error> {
        self.sender.take();
        self.join
            .take()
            .ok_or(Error::Closed)?
            .join()
            .map_err(|_| Error::Closed)
    }
}
impl Drop for Writer {
    fn drop(&mut self) {
        if self.join.is_some() {
            self.shared.incomplete(Reason::OwnerDropped, 0);
        }
        self.sender.take();
    }
}
#[derive(Debug, Clone)]
pub struct Scan {
    pub header: Header,
    pub events: u64,
    pub complete: bool,
    pub valid_bytes: u64,
    pub truncated: bool,
    pub dropped: u64,
    pub unknown_loss: bool,
    pub reason: Option<Reason>,
}
/// Read one bounded line at a time. A partial final line is recoverable; invalid
/// complete records and trailing content after a footer are rejected.
pub fn scan<R: Read>(reader: R) -> Result<Scan, Error> {
    let mut reader = BufReader::new(reader);
    let mut header = None;
    let mut events = 0u64;
    let mut valid_bytes = 0u64;
    let mut complete = false;
    let mut footer = false;
    let mut gap_seen = false;
    let mut known_gap_count = 0u64;
    let mut unknown_loss = false;
    let mut dropped_total = 0u64;
    let mut completion_reason = None;
    let mut truncated = false;
    loop {
        let mut bytes = Vec::new();
        let n = reader
            .by_ref()
            .take((MAX_LINE + 1) as u64)
            .read_until(b'\n', &mut bytes)?;
        if n == 0 {
            break;
        }
        if n > MAX_LINE {
            return Err(Error::Invalid("record too large"));
        }
        if footer {
            return Err(Error::Invalid("content after footer"));
        }
        if bytes.last() != Some(&b'\n') {
            truncated = true;
            break;
        }
        let record: Record = serde_json::from_slice(&bytes)?;
        match record {
            Record::Header {
                schema_version: 1,
                metadata,
            } if header.is_none() && valid_bytes == 0 => {
                canonical(&metadata.created_unix_ms)?;
                header = Some(metadata);
            }
            Record::Event { .. } if header.is_some() => events += 1,
            Record::Gap { count, cause } if header.is_some() => {
                completion_reason.get_or_insert(cause);
                gap_seen = true;
                if let Some(count) = count {
                    known_gap_count = known_gap_count
                        .checked_add(canonical(&count)?)
                        .ok_or(Error::Invalid("gap count overflow"))?;
                } else {
                    unknown_loss = true;
                }
            }
            Record::Footer {
                complete: claimed,
                events: count,
                dropped,
                reason,
            } if header.is_some() => {
                if canonical(&count)? != events {
                    return Err(Error::Invalid("event count mismatch"));
                }
                let dropped = canonical(&dropped)?;
                if (unknown_loss && dropped < known_gap_count)
                    || (!unknown_loss && dropped != known_gap_count)
                {
                    return Err(Error::Invalid("gap/footer count mismatch"));
                }
                dropped_total = dropped;
                if reason.is_some() {
                    completion_reason = reason;
                }
                if claimed && (reason.is_some() || gap_seen || dropped > 0) {
                    return Err(Error::Invalid("inconsistent footer"));
                }
                complete = claimed;
                footer = true;
            }
            _ => return Err(Error::Invalid("record order or schema version")),
        }
        valid_bytes += n as u64;
        if valid_bytes > MAX_FILE {
            return Err(Error::Invalid("file too large"));
        }
    }
    Ok(Scan {
        header: header.ok_or(Error::Invalid("missing header"))?,
        events,
        complete: complete && !truncated,
        valid_bytes,
        truncated,
        dropped: if footer {
            dropped_total
        } else {
            known_gap_count
        },
        unknown_loss,
        reason: completion_reason,
    })
}
fn canonical(value: &str) -> Result<u64, Error> {
    let number = value
        .parse::<u64>()
        .map_err(|_| Error::Invalid("counter"))?;
    if value != number.to_string() {
        return Err(Error::Invalid("noncanonical counter"));
    }
    Ok(number)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Condvar;
    fn header() -> Header {
        Header {
            capture_id: "capture".into(),
            owner: "native".into(),
            server_instance_id: "server".into(),
            session_epoch: "session".into(),
            created_unix_ms: "1".into(),
            config: serde_json::json!({}),
        }
    }
    #[derive(Clone, Default)]
    struct Memory(Arc<Mutex<Vec<u8>>>);
    impl Write for Memory {
        fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
            self.0.lock().unwrap().extend_from_slice(bytes);
            Ok(bytes.len())
        }
        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }
    struct GapSink {
        memory: Memory,
        state: Arc<Mutex<Option<Arc<Shared>>>>,
        fail: bool,
        partial: bool,
        failed: bool,
    }
    impl Write for GapSink {
        fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
            if self.partial {
                self.partial = false;
                self.failed = true;
                return Err(io::Error::from(io::ErrorKind::Other));
            }
            if bytes.starts_with(b"{\"record\":\"gap\"") && !self.failed {
                self.state
                    .lock()
                    .unwrap()
                    .as_ref()
                    .unwrap()
                    .incomplete(Reason::SourceGap, 0);
                if self.fail {
                    self.partial = true;
                    return self.memory.write(&bytes[..5]);
                }
            }
            self.memory.write(bytes)
        }
        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }
    #[test]
    fn finalization_snapshots_accounting_before_sink_calls() {
        for fail in [false, true] {
            let memory = Memory::default();
            let state = Arc::new(Mutex::new(None));
            let writer = Writer::start(
                GapSink {
                    memory: memory.clone(),
                    state: state.clone(),
                    fail,
                    partial: false,
                    failed: false,
                },
                header(),
                Options::default(),
            )
            .unwrap();
            *state.lock().unwrap() = Some(writer.shared.clone());
            writer.incomplete(Reason::SizeLimit, 1);
            let report = writer.finish().unwrap();
            let scan = scan(&memory.0.lock().unwrap()[..]).unwrap();
            if fail {
                assert_eq!(report.reason, Some(Reason::IoError));
                assert!(scan.truncated);
                assert_eq!(scan.dropped, 0);
            } else {
                assert_eq!(report.dropped, 1);
                assert_eq!(scan.dropped, 1);
                assert!(!scan.unknown_loss);
            }
        }
    }
    #[test]
    fn failed_first_gap_does_not_append_to_partial_tail() {
        let memory = Memory::default();
        let state = Arc::new(Mutex::new(None));
        let writer = Writer::start(
            GapSink {
                memory: memory.clone(),
                state: state.clone(),
                fail: true,
                partial: false,
                failed: false,
            },
            header(),
            Options::default(),
        )
        .unwrap();
        *state.lock().unwrap() = Some(writer.shared.clone());
        writer.incomplete(Reason::SourceGap, 0);
        writer.incomplete(Reason::SizeLimit, 1);
        assert_eq!(writer.finish().unwrap().reason, Some(Reason::IoError));
        let scan = scan(&memory.0.lock().unwrap()[..]).unwrap();
        assert!(scan.truncated);
        assert_eq!(scan.dropped, 0);
    }
    #[test]
    fn unknown_loss_preserves_known_loss_and_saturates() {
        let sink = Memory::default();
        let writer = Writer::start(sink.clone(), header(), Options::default()).unwrap();
        writer.incomplete(Reason::SourceGap, 0);
        writer.incomplete(Reason::SizeLimit, u64::MAX);
        writer.incomplete(Reason::SizeLimit, 1);
        let report = writer.finish().unwrap();
        assert_eq!(report.dropped, u64::MAX);
        let scanned = scan(&sink.0.lock().unwrap()[..]).unwrap();
        assert!(scanned.unknown_loss);
        assert_eq!(scanned.dropped, u64::MAX);
    }
    #[test]
    fn writer_rejects_unreadable_nesting_before_io() {
        let mut nested = serde_json::Value::Null;
        for _ in 0..200 {
            nested = serde_json::json!([nested]);
        }
        let sink = Memory::default();
        let mut h = header();
        h.config = nested.clone();
        assert!(Writer::start(sink.clone(), h, Options::default()).is_err());
        assert!(sink.0.lock().unwrap().is_empty());
        let writer = Writer::start(sink.clone(), header(), Options::default()).unwrap();
        assert!(writer.event(nested).is_err());
        assert!(!writer.finish().unwrap().complete);
        let scanned = scan(&sink.0.lock().unwrap()[..]).unwrap();
        assert!(!scanned.complete);
        assert_eq!(scanned.events, 0);
    }
    #[test]
    fn complete_capture_counts_written_events_and_scans_without_loading_them() {
        let sink = Memory::default();
        let writer = Writer::start(sink.clone(), header(), Options::default()).unwrap();
        for index in 0..10 {
            writer
                .event(serde_json::json!({"sequence":index.to_string()}))
                .unwrap();
        }
        let report = writer.finish().unwrap();
        assert!(report.complete);
        assert_eq!(report.events, 10);
        let bytes = sink.0.lock().unwrap().clone();
        assert_eq!(report.bytes, bytes.len() as u64);
        let scan = scan(bytes.as_slice()).unwrap();
        assert!(scan.complete);
        assert_eq!(scan.events, 10);
        assert!(!scan.truncated);
    }
    #[test]
    fn partial_tail_recovers_only_complete_records() {
        let mut bytes = line(&Record::Header {
            schema_version: 1,
            metadata: header(),
        })
        .unwrap();
        bytes.extend(line(&Record::Event { event: Value::Null }).unwrap());
        let valid = bytes.len();
        bytes.extend(b"{\"record\":\"event\"");
        let result = scan(bytes.as_slice()).unwrap();
        assert!(!result.complete);
        assert!(result.truncated);
        assert_eq!(result.events, 1);
        assert_eq!(result.valid_bytes, valid as u64);
    }
    struct Failing {
        memory: Memory,
        remaining: usize,
    }
    impl Write for Failing {
        fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
            if self.remaining == 0 {
                return Err(io::Error::from(io::ErrorKind::StorageFull));
            }
            let n = self.remaining.min(bytes.len());
            self.remaining -= n;
            self.memory.write(&bytes[..n])
        }
        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }
    #[test]
    fn partial_disk_failure_preserves_readable_prefix_and_reports_actual_bytes() {
        let memory = Memory::default();
        let header_size = line(&Record::Header {
            schema_version: 1,
            metadata: header(),
        })
        .unwrap()
        .len();
        let sink = Failing {
            memory: memory.clone(),
            remaining: header_size + 5,
        };
        let writer = Writer::start(sink, header(), Options::default()).unwrap();
        writer
            .event(serde_json::json!({"message":"payload"}))
            .unwrap();
        let report = writer.finish().unwrap();
        assert!(!report.complete);
        assert_eq!(report.reason, Some(Reason::DiskFull));
        assert_eq!(report.events, 0);
        let bytes = memory.0.lock().unwrap().clone();
        assert_eq!(report.bytes, bytes.len() as u64);
        let recovered = scan(bytes.as_slice()).unwrap();
        assert!(!recovered.complete);
        assert_eq!(recovered.events, 0);
        assert!(recovered.truncated);
    }
    struct Gate {
        state: Mutex<(bool, bool)>,
        cv: Condvar,
    }
    struct Slow {
        memory: Memory,
        gate: Arc<Gate>,
        writes: usize,
    }
    impl Write for Slow {
        fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
            self.writes += 1;
            if self.writes == 2 {
                let mut state = self.gate.state.lock().unwrap();
                state.0 = true;
                self.gate.cv.notify_all();
                let (next, _) = self
                    .gate
                    .cv
                    .wait_timeout_while(state, std::time::Duration::from_secs(2), |s| !s.1)
                    .unwrap();
                state = next;
                assert!(state.1, "test gate timeout");
            }
            self.memory.write(bytes)
        }
        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }
    #[test]
    fn full_queue_stops_accepting_and_writes_an_incomplete_footer() {
        let memory = Memory::default();
        let gate = Arc::new(Gate {
            state: Mutex::new((false, false)),
            cv: Condvar::new(),
        });
        let writer = Writer::start(
            Slow {
                memory: memory.clone(),
                gate: gate.clone(),
                writes: 0,
            },
            header(),
            Options {
                queue: 1,
                ..Options::default()
            },
        )
        .unwrap();
        writer.event(Value::Null).unwrap();
        let state = gate.state.lock().unwrap();
        let (_guard, timeout) = gate
            .cv
            .wait_timeout_while(state, std::time::Duration::from_secs(2), |s| !s.0)
            .unwrap();
        assert!(!timeout.timed_out());
        drop(_guard);
        writer.event(Value::Null).unwrap();
        assert!(matches!(writer.event(Value::Null), Err(Error::QueueFull)));
        assert!(matches!(writer.event(Value::Null), Err(Error::Closed)));
        gate.state.lock().unwrap().1 = true;
        gate.cv.notify_all();
        let report = writer.finish().unwrap();
        assert_eq!(report.reason, Some(Reason::QueueFull));
        assert_eq!(report.dropped, 1);
        assert_eq!(report.events, 2);
        assert!(!scan(memory.0.lock().unwrap().as_slice()).unwrap().complete);
    }
    #[test]
    fn size_limit_does_not_claim_queued_records_were_written() {
        let memory = Memory::default();
        let writer = Writer::start(
            memory.clone(),
            header(),
            Options {
                max_bytes: 3 * MAX_LINE as u64,
                ..Options::default()
            },
        )
        .unwrap();
        for _ in 0..8 {
            if writer.event(Value::String("x".repeat(4000))).is_err() {
                break;
            }
        }
        let report = writer.finish().unwrap();
        assert_eq!(report.reason, Some(Reason::SizeLimit));
        assert!(!report.complete);
        assert!(report.bytes <= 3 * MAX_LINE as u64);
        let scanned = scan(memory.0.lock().unwrap().as_slice()).unwrap();
        assert!(!scanned.complete);
        assert_eq!(scanned.events, report.events);
    }
    #[test]
    fn malformed_record_order_counters_and_oversized_lines_are_rejected() {
        assert!(scan(b"{\"record\":\"event\",\"event\":null}\n".as_slice()).is_err());
        assert!(scan(vec![b'x'; MAX_LINE + 1].as_slice()).is_err());
        let mut prefix = line(&Record::Header {
            schema_version: 1,
            metadata: header(),
        })
        .unwrap();
        let mut bad = prefix.clone();
        bad.extend(
            line(&Record::Footer {
                complete: true,
                events: "01".into(),
                dropped: "0".into(),
                reason: None,
            })
            .unwrap(),
        );
        assert!(scan(bad.as_slice()).is_err());
        prefix.extend(
            line(&Record::Gap {
                cause: Reason::SourceGap,
                count: None,
            })
            .unwrap(),
        );
        prefix.extend(
            line(&Record::Footer {
                complete: true,
                events: "0".into(),
                dropped: "0".into(),
                reason: None,
            })
            .unwrap(),
        );
        assert!(scan(prefix.as_slice()).is_err());
    }
    #[test]
    fn writer_rejects_invalid_header_timestamp_before_any_io() {
        for timestamp in ["01", "-1", "18446744073709551616", "bad"] {
            let sink = Memory::default();
            let mut metadata = header();
            metadata.created_unix_ms = timestamp.into();
            assert!(Writer::start(sink.clone(), metadata, Options::default()).is_err());
            assert!(sink.0.lock().unwrap().is_empty());
        }
    }
    #[test]
    fn scanner_reconciles_known_and_unknown_gap_counts() {
        let prefix = line(&Record::Header {
            schema_version: 1,
            metadata: header(),
        })
        .unwrap();
        let footer = |count: &str| {
            line(&Record::Footer {
                complete: false,
                events: "0".into(),
                dropped: count.into(),
                reason: Some(Reason::SourceGap),
            })
            .unwrap()
        };
        let gap = |count: Option<&str>| {
            line(&Record::Gap {
                cause: Reason::SourceGap,
                count: count.map(str::to_owned),
            })
            .unwrap()
        };
        let mut bytes = prefix.clone();
        bytes.extend(gap(Some("10")));
        bytes.extend(footer("0"));
        assert!(scan(bytes.as_slice()).is_err());
        let mut bytes = prefix.clone();
        bytes.extend(gap(Some("10")));
        bytes.extend(footer("10"));
        let result = scan(bytes.as_slice()).unwrap();
        assert_eq!(result.dropped, 10);
        assert!(!result.unknown_loss);
        let mut bytes = prefix.clone();
        bytes.extend(gap(Some("10")));
        bytes.extend(gap(None));
        bytes.extend(footer("12"));
        let result = scan(bytes.as_slice()).unwrap();
        assert_eq!(result.dropped, 12);
        assert!(result.unknown_loss);
        let mut bytes = prefix;
        bytes.extend(gap(Some("18446744073709551615")));
        bytes.extend(gap(Some("1")));
        assert!(scan(bytes.as_slice()).is_err());
    }
}
