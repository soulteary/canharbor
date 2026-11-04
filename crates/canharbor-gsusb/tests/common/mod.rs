// SPDX-License-Identifier: AGPL-3.0-or-later
#![allow(dead_code)]
use canharbor_gsusb::{Error, control::Request, device::Transport, usb::ReceiveTransport};
use std::{
    collections::VecDeque,
    sync::{Arc, Mutex},
    thread,
    time::Duration,
};
#[derive(Default)]
pub struct State {
    pub threads: Vec<thread::ThreadId>,
    pub reads: VecDeque<Result<Vec<u8>, Error>>,
    pub writes: usize,
    pub resets: usize,
    pub fail_write: bool,
    pub features: Option<u32>,
    pub fail_reset: bool,
    pub fail_cancel: bool,
    pub cancels: usize,
    pub gate: Option<std::sync::Arc<Gate>>,
    pub cancel_gate: Option<std::sync::Arc<Gate>>,
}
#[derive(Clone, Default)]
pub struct Fake(pub Arc<Mutex<State>>);
impl Transport for Fake {
    fn control_in(&mut self, r: Request, _: usize) -> Result<Vec<u8>, Error> {
        self.0.lock().unwrap().threads.push(thread::current().id());
        let features = self.0.lock().unwrap().features.unwrap_or(1);
        Ok(match r.request {
            5 => vec![0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0],
            4 | 11 => {
                let mut words = vec![features, 48_000_000, 1, 16, 1, 8, 4, 1, 1024, 1];
                if r.request == 11 {
                    words.extend([1, 16, 1, 8, 4, 1, 1024, 1]);
                }
                words.into_iter().flat_map(u32::to_le_bytes).collect()
            }
            _ => panic!("unexpected control request"),
        })
    }
    fn control_out(&mut self, r: Request, bytes: &[u8]) -> Result<(), Error> {
        let mut s = self.0.lock().unwrap();
        s.threads.push(thread::current().id());
        if r.request == 2 && bytes[..4] == [0, 0, 0, 0] {
            s.resets += 1;
            if s.fail_reset {
                return Err(Error::Transport);
            }
        }
        Ok(())
    }
    fn write(&mut self, bytes: &[u8]) -> Result<(), Error> {
        let mut s = self.0.lock().unwrap();
        s.threads.push(thread::current().id());
        s.writes += 1;
        if s.fail_write {
            return Err(Error::Transport);
        }
        s.reads.push_back(Ok(bytes.to_vec()));
        Ok(())
    }
}
impl ReceiveTransport for Fake {
    fn cancel(&mut self, _: Duration) -> Result<(), Error> {
        let gate = self.0.lock().unwrap().cancel_gate.clone();
        if let Some(gate) = gate {
            gate.wait();
        }
        let mut state = self.0.lock().unwrap();
        state.cancels += 1;
        if state.fail_cancel {
            Err(Error::Transport)
        } else {
            state.reads.clear();
            Ok(())
        }
    }
    fn read(&mut self, wait: Duration) -> Result<Option<Vec<u8>>, Error> {
        let gate = self.0.lock().unwrap().gate.clone();
        if let Some(gate) = gate {
            gate.wait();
        }
        let next = {
            let mut s = self.0.lock().unwrap();
            s.threads.push(thread::current().id());
            s.reads.pop_front()
        };
        match next {
            Some(r) => r.map(Some),
            None => {
                thread::sleep(wait);
                Ok(None)
            }
        }
    }
}

#[derive(Default)]
pub struct Gate {
    state: Mutex<(bool, bool)>,
    cv: std::sync::Condvar,
}
impl Gate {
    fn wait(&self) {
        let mut state = self.state.lock().unwrap();
        state.0 = true;
        self.cv.notify_all();
        while !state.1 {
            let (s, timeout) = self.cv.wait_timeout(state, Duration::from_secs(2)).unwrap();
            state = s;
            if timeout.timed_out() {
                break;
            }
        }
    }
    pub fn entered(&self) {
        let state = self.state.lock().unwrap();
        let (_guard, timeout) = self
            .cv
            .wait_timeout_while(state, Duration::from_secs(2), |s| !s.0)
            .unwrap();
        assert!(!timeout.timed_out());
    }
    pub fn release(&self) {
        self.state.lock().unwrap().1 = true;
        self.cv.notify_all();
    }
}
