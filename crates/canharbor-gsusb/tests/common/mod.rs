// SPDX-License-Identifier: AGPL-3.0-or-later
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
}
#[derive(Clone, Default)]
pub struct Fake(pub Arc<Mutex<State>>);
impl Transport for Fake {
    fn control_in(&mut self, r: Request, _: usize) -> Result<Vec<u8>, Error> {
        self.0.lock().unwrap().threads.push(thread::current().id());
        Ok(match r.request {
            5 => vec![0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0],
            4 => [1u32, 48_000_000, 1, 16, 1, 8, 4, 1, 1024, 1]
                .into_iter()
                .flat_map(u32::to_le_bytes)
                .collect(),
            _ => panic!("unexpected control request"),
        })
    }
    fn control_out(&mut self, r: Request, bytes: &[u8]) -> Result<(), Error> {
        let mut s = self.0.lock().unwrap();
        s.threads.push(thread::current().id());
        if r.request == 2 && bytes[..4] == [0, 0, 0, 0] {
            s.resets += 1;
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
    fn read(&mut self, wait: Duration) -> Result<Option<Vec<u8>>, Error> {
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
