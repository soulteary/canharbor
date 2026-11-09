// SPDX-License-Identifier: AGPL-3.0-or-later
//! User-interface preferences, independent of runtime sockets and CAN state.
use crate::local::current_uid;
use std::{
    fs,
    io::{self, Write},
    os::unix::fs::{DirBuilderExt, MetadataExt, OpenOptionsExt},
    path::PathBuf,
    sync::Mutex,
};

pub use canharbor_api::{UiLocale as Locale, UiPreferences as Preferences};

pub fn default_path() -> Option<PathBuf> {
    let root = if let Some(path) = std::env::var_os("CANHARBOR_CONFIG_DIR") {
        PathBuf::from(path)
    } else if cfg!(target_os = "macos") {
        PathBuf::from(std::env::var_os("HOME")?).join("Library/Application Support/CANHarbor")
    } else {
        std::env::var_os("XDG_CONFIG_HOME")
            .map(PathBuf::from)
            .unwrap_or_else(|| {
                PathBuf::from(std::env::var_os("HOME").unwrap_or_default()).join(".config")
            })
            .join("canharbor")
    };
    root.is_absolute().then(|| root.join("preferences.json"))
}

pub struct Store {
    file: Option<PathBuf>,
    value: Mutex<Preferences>,
}
impl Store {
    pub fn new(file: Option<PathBuf>) -> Self {
        let value = file
            .as_ref()
            .and_then(|p| {
                let meta = fs::symlink_metadata(p).ok()?;
                if !meta.is_file() || meta.uid() != current_uid() || meta.len() > 128 {
                    return None;
                }
                serde_json::from_slice(&fs::read(p).ok()?).ok()
            })
            .unwrap_or_default();
        Self {
            file,
            value: Mutex::new(value),
        }
    }
    pub fn get(&self) -> Preferences {
        *self.value.lock().unwrap()
    }
    pub fn set(&self, next: Preferences) -> io::Result<()> {
        let mut value = self.value.lock().unwrap();
        if let Some(file) = &self.file {
            let root = file
                .parent()
                .ok_or_else(|| io::Error::other("missing settings directory"))?;
            fs::DirBuilder::new()
                .recursive(true)
                .mode(0o700)
                .create(root)?;
            let meta = fs::symlink_metadata(root)?;
            if !meta.is_dir() || meta.uid() != current_uid() || meta.mode() & 0o077 != 0 {
                return Err(io::Error::other(
                    "settings directory must be private and owned by this user",
                ));
            }
            let temporary = root.join(format!(".preferences-{}.tmp", uuid::Uuid::new_v4()));
            let result = (|| {
                let mut output = fs::OpenOptions::new()
                    .write(true)
                    .create_new(true)
                    .mode(0o600)
                    .open(&temporary)?;
                output.write_all(&serde_json::to_vec(&next)?)?;
                output.sync_all()?;
                fs::rename(&temporary, file)?;
                fs::File::open(root)?.sync_all()
            })();
            if result.is_err() {
                let _ = fs::remove_file(&temporary);
            }
            result?;
        }
        *value = next;
        Ok(())
    }
}
