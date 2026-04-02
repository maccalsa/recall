use notify_debouncer_mini::{new_debouncer, DebouncedEventKind};
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tauri::Emitter;

#[derive(Debug, Clone, Serialize)]
pub struct CheatChangedPayload {
    /// "upsert" (created or modified) or "delete"
    pub kind: String,
    pub filename: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ConfigChangedPayload {
    pub file: String,
}

pub fn start_file_watcher(app_handle: tauri::AppHandle, config_dir: PathBuf, cheats_dir: PathBuf) {
    std::thread::spawn(move || {
        if let Err(e) = run_watcher(app_handle, config_dir, cheats_dir) {
            eprintln!("File watcher error: {e}");
        }
    });
}

fn run_watcher(
    app_handle: tauri::AppHandle,
    config_dir: PathBuf,
    cheats_dir: PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let _ = std::fs::create_dir_all(&cheats_dir);
    let _ = std::fs::create_dir_all(&config_dir);

    let cheats_dir_clone = cheats_dir.clone();
    let config_dir_clone = config_dir.clone();
    let handle = app_handle.clone();

    let mut debouncer = new_debouncer(
        Duration::from_millis(300),
        move |result: Result<Vec<notify_debouncer_mini::DebouncedEvent>, notify::Error>| {
            let events = match result {
                Ok(events) => events,
                Err(e) => {
                    eprintln!("Watcher debounce error: {e:?}");
                    return;
                }
            };

            for event in events {
                if event.kind != DebouncedEventKind::Any {
                    continue;
                }

                let path = &event.path;
                if path.starts_with(&cheats_dir_clone) {
                    handle_cheat_event(&handle, path);
                } else if path.starts_with(&config_dir_clone) {
                    handle_config_event(&handle, path);
                }
            }
        },
    )?;

    let watcher = debouncer.watcher();
    watcher.watch(&cheats_dir, notify::RecursiveMode::NonRecursive)?;
    watcher.watch(&config_dir, notify::RecursiveMode::NonRecursive)?;

    // Keep thread alive so the watcher stays active
    loop {
        std::thread::park();
    }
}

fn handle_cheat_event(app: &tauri::AppHandle, path: &Path) {
    if path.extension().and_then(|e| e.to_str()) != Some("md") {
        return;
    }

    let filename = match path.file_name().and_then(|n| n.to_str()) {
        Some(n) => n.to_string(),
        None => return,
    };

    let kind = if path.exists() { "upsert" } else { "delete" };

    let payload = CheatChangedPayload {
        kind: kind.to_string(),
        filename,
    };
    let _ = app.emit("recall://cheat-changed", payload);
}

fn handle_config_event(app: &tauri::AppHandle, path: &Path) {
    let filename = match path.file_name().and_then(|n| n.to_str()) {
        Some(n) => n.to_string(),
        None => return,
    };

    match filename.as_str() {
        "app-mappings.yaml" | "config.json" => {
            let payload = ConfigChangedPayload { file: filename };
            let _ = app.emit("recall://config-changed", payload);
        }
        _ => {}
    }
}
