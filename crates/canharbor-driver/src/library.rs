// SPDX-License-Identifier: AGPL-3.0-or-later
//! Explicit, process-resident native libraries. No implicit search or unloading.
use std::{
    collections::{BTreeMap, BTreeSet},
    ffi::{CStr, CString},
    io,
    os::unix::{ffi::OsStrExt, fs::MetadataExt},
    path::{Path, PathBuf},
    ptr::NonNull,
    sync::{Arc, Mutex, OnceLock},
};
const MAX_LIBRARIES: usize = 16;
static LOADED: OnceLock<Mutex<BTreeMap<PathBuf, Arc<Library>>>> = OnceLock::new();
pub struct Library {
    handle: NonNull<libc::c_void>,
    path: PathBuf,
    identity: (u64, u64),
    claims: Mutex<BTreeSet<u32>>,
}
// SAFETY: dlopen/dlsym handles are process-wide and thread-safe. Function calls
// retain their own ABI/threading requirements; resolving a symbol does not call it.
unsafe impl Send for Library {}
unsafe impl Sync for Library {}
fn loader_error() -> io::Error {
    // SAFETY: dlerror returns NULL or a NUL-terminated thread-local diagnostic.
    let message = unsafe {
        let pointer = libc::dlerror();
        if pointer.is_null() {
            "native loader failed".into()
        } else {
            CStr::from_ptr(pointer).to_string_lossy().into_owned()
        }
    };
    io::Error::other(message)
}
impl Library {
    /// Load only a caller-selected absolute library path. Images stay resident
    /// because foreign background threads may survive a failed teardown.
    ///
    /// # Safety
    /// The image and its dependencies must be trusted native code. Its constructors
    /// must be safe to run in this process. This is not a sandbox for plugins.
    pub unsafe fn load(path: &Path) -> io::Result<Arc<Self>> {
        if !path.is_absolute() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "native library path must be absolute",
            ));
        }
        let path = path.canonicalize()?;
        let metadata = path.metadata()?;
        if !metadata.is_file() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "native library must be a regular file",
            ));
        }
        let mut loaded = LOADED
            .get_or_init(Default::default)
            .lock()
            .map_err(|_| io::Error::other("native library cache unavailable"))?;
        if let Some(library) = loaded.get(&path) {
            return Ok(library.clone());
        }
        if loaded.len() >= MAX_LIBRARIES {
            return Err(io::Error::other("native library limit reached"));
        }
        let identity = (metadata.dev(), metadata.ino());
        if let Some(library) = loaded
            .values()
            .find(|library| library.identity == identity)
            .cloned()
        {
            loaded.insert(path, library.clone());
            return Ok(library);
        }
        let name = CString::new(path.as_os_str().as_bytes()).map_err(|_| {
            io::Error::new(
                io::ErrorKind::InvalidInput,
                "native library path contains NUL",
            )
        })?;
        // SAFETY: the caller authorizes constructors from this trusted image;
        // name is NUL terminated and no linker search by basename is requested.
        let handle =
            NonNull::new(unsafe { libc::dlopen(name.as_ptr(), libc::RTLD_NOW | libc::RTLD_LOCAL) })
                .ok_or_else(loader_error)?;
        let library = Arc::new(Self {
            handle,
            path: path.clone(),
            identity,
            claims: Mutex::new(BTreeSet::new()),
        });
        loaded.insert(path, library.clone());
        Ok(library)
    }
    /// Reserve selected handles before configuration can mutate foreign globals.
    pub fn claim(self: &Arc<Self>, keys: &[u32]) -> io::Result<Claim> {
        let unique = keys.iter().copied().collect::<BTreeSet<_>>();
        if keys.is_empty() || keys.len() > 32 || unique.len() != keys.len() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "invalid native channel selection",
            ));
        }
        let mut claims = self
            .claims
            .lock()
            .map_err(|_| io::Error::other("native channel ownership unavailable"))?;
        if unique.iter().any(|key| claims.contains(key)) {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "native channel is already owned",
            ));
        }
        claims.extend(unique.iter().copied());
        Ok(Claim {
            library: self.clone(),
            keys: unique,
        })
    }
    pub fn path(&self) -> &Path {
        &self.path
    }
    /// Resolve a function from the selected image, retaining this library while
    /// the returned function pointer is in use.
    ///
    /// # Safety
    /// `T` must be the exact native function-pointer type for this symbol. Calls
    /// must satisfy that API's pointer, ownership, and threading contracts.
    pub unsafe fn symbol<T: Copy>(&self, name: &CStr) -> io::Result<T> {
        if std::mem::size_of::<T>() != std::mem::size_of::<*mut libc::c_void>() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "symbol type must be pointer-sized",
            ));
        }
        // SAFETY: the image is pinned, name is terminated, and the caller supplies
        // the exact function type. POSIX supports converting dlsym function pointers.
        unsafe {
            libc::dlerror();
            let pointer = libc::dlsym(self.handle.as_ptr(), name.as_ptr());
            if pointer.is_null() {
                return Err(loader_error());
            }
            Ok(std::mem::transmute_copy(&pointer))
        }
    }
}

/// Releases only this adapter's Rust ownership reservation, after driver cleanup.
pub struct Claim {
    library: Arc<Library>,
    keys: BTreeSet<u32>,
}
impl Drop for Claim {
    fn drop(&mut self) {
        if let Ok(mut claims) = self.library.claims.lock() {
            for key in &self.keys {
                claims.remove(key);
            }
        }
    }
}
