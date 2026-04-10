mod context;
mod watcher;

use context::{detect_active_window, load_mappings, resolve_mapping, ContextPayload};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Instant;
use tauri::{Emitter, Manager};

fn config_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("recall")
}

fn cheats_dir() -> PathBuf {
    config_dir().join("cheats")
}

static LAST_SHOW: Mutex<Option<Instant>> = Mutex::new(None);
const DOUBLE_PRESS_MS: u128 = 500;

fn show_with_context(app: &tauri::AppHandle) {
    let window_class = detect_active_window();

    let mappings = load_mappings(&config_dir());
    let mapped_cheat = window_class
        .as_ref()
        .and_then(|wc| resolve_mapping(&mappings, wc))
        .filter(|filename| cheats_dir().join(filename).exists());

    let now = Instant::now();
    let is_double_press = LAST_SHOW
        .lock()
        .ok()
        .and_then(|guard| *guard)
        .map(|prev| now.duration_since(prev).as_millis() < DOUBLE_PRESS_MS)
        .unwrap_or(false);

    if let Ok(mut guard) = LAST_SHOW.lock() {
        *guard = Some(now);
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }

    let payload = ContextPayload {
        window_class,
        mapped_cheat,
        is_double_press,
    };
    let _ = app.emit("recall://context", payload);
}

fn hide_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

fn toggle_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            hide_window(app);
        } else {
            show_with_context(app);
        }
    }
}

pub fn socket_path() -> PathBuf {
    let dir = std::env::var("XDG_RUNTIME_DIR").unwrap_or_else(|_| "/tmp".to_string());
    PathBuf::from(dir).join("recall.sock")
}

pub fn send_toggle() -> std::io::Result<()> {
    use std::io::Write;
    use std::os::unix::net::UnixStream;

    let mut stream = UnixStream::connect(socket_path())?;
    stream.write_all(b"toggle")?;
    Ok(())
}

fn start_ipc_listener(app_handle: tauri::AppHandle) {
    use std::io::Read;
    use std::os::unix::net::UnixListener;

    let path = socket_path();
    let _ = std::fs::remove_file(&path);

    let listener = match UnixListener::bind(&path) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("Failed to bind IPC socket at {}: {e}", path.display());
            return;
        }
    };

    std::thread::spawn(move || {
        for stream in listener.incoming() {
            match stream {
                Ok(mut stream) => {
                    let mut buf = [0u8; 64];
                    if let Ok(n) = stream.read(&mut buf) {
                        if std::str::from_utf8(&buf[..n]).unwrap_or("").trim() == "toggle" {
                            toggle_main_window(&app_handle);
                        }
                    }
                }
                Err(e) => eprintln!("IPC connection error: {e}"),
            }
        }
    });
}

#[tauri::command]
fn toggle_window(app: tauri::AppHandle) {
    toggle_main_window(&app);
}

#[tauri::command]
fn read_cheat_file(filename: String) -> Result<String, String> {
    let path = cheats_dir().join(&filename);
    std::fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {e}", path.display()))
}

#[tauri::command]
fn list_cheat_files() -> Result<Vec<String>, String> {
    let dir = cheats_dir();
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let mut files: Vec<String> = std::fs::read_dir(&dir)
        .map_err(|e| format!("Failed to read cheats directory: {e}"))?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("md") {
                path.file_name().and_then(|n| n.to_str()).map(String::from)
            } else {
                None
            }
        })
        .collect();
    files.sort();
    Ok(files)
}

#[tauri::command]
fn read_history() -> Result<String, String> {
    let path = config_dir().join("history.json");
    match std::fs::read_to_string(&path) {
        Ok(contents) => Ok(contents),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok("[]".to_string()),
        Err(e) => Err(format!("Failed to read history: {e}")),
    }
}

#[tauri::command]
fn write_history(json: String) -> Result<(), String> {
    let dir = config_dir();
    std::fs::create_dir_all(&dir).map_err(|e| format!("Failed to create config directory: {e}"))?;
    std::fs::write(dir.join("history.json"), json)
        .map_err(|e| format!("Failed to write history: {e}"))
}

#[tauri::command]
fn read_config() -> Result<String, String> {
    let path = config_dir().join("config.json");
    match std::fs::read_to_string(&path) {
        Ok(contents) => Ok(contents),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok("{}".to_string()),
        Err(e) => Err(format!("Failed to read config: {e}")),
    }
}

fn collect_bundled_resource_files(resource_dir: &std::path::Path) -> Vec<std::path::PathBuf> {
    use std::path::Path;

    fn walk(dir: &Path, out: &mut Vec<std::path::PathBuf>) {
        let Ok(entries) = std::fs::read_dir(dir) else {
            return;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                walk(&path, out);
                continue;
            }
            let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
                continue;
            };
            if name.ends_with(".md") || name == "app-mappings.yaml" {
                out.push(path);
            }
        }
    }

    let mut paths = Vec::new();
    walk(resource_dir, &mut paths);
    paths
}

fn setup_first_run(app: &tauri::AppHandle) -> bool {
    let cheats = cheats_dir();
    let config = config_dir();
    let _ = std::fs::create_dir_all(&cheats);
    let _ = std::fs::create_dir_all(&config);

    let has_md_files = std::fs::read_dir(&cheats)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .any(|e| e.path().extension().and_then(|ext| ext.to_str()) == Some("md"))
        })
        .unwrap_or(false);

    if has_md_files {
        return false;
    }

    let resource_dir = match app.path().resource_dir() {
        Ok(dir) => dir,
        Err(_) => return false,
    };

    for path in collect_bundled_resource_files(&resource_dir) {
        let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        if name.ends_with(".md") {
            let dest = cheats.join(name);
            let _ = std::fs::copy(&path, &dest);
        } else if name == "app-mappings.yaml" {
            let dest = config.join(name);
            if !dest.exists() {
                let _ = std::fs::copy(&path, &dest);
            }
        }
    }

    true
}

#[tauri::command]
fn is_first_run() -> bool {
    let marker = config_dir().join(".first-run-done");
    if marker.exists() {
        return false;
    }
    let _ = std::fs::write(&marker, "");
    true
}

#[tauri::command]
fn write_config(json: String) -> Result<(), String> {
    let dir = config_dir();
    std::fs::create_dir_all(&dir).map_err(|e| format!("Failed to create config directory: {e}"))?;
    std::fs::write(dir.join("config.json"), json)
        .map_err(|e| format!("Failed to write config: {e}"))
}

#[tauri::command]
fn detect_context() -> ContextPayload {
    let window_class = detect_active_window();
    let mappings = load_mappings(&config_dir());
    let mapped_cheat = window_class
        .as_ref()
        .and_then(|wc| resolve_mapping(&mappings, wc))
        .filter(|filename| cheats_dir().join(filename).exists());

    ContextPayload {
        window_class,
        mapped_cheat,
        is_double_press: false,
    }
}

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            start_ipc_listener(app.handle().clone());

            setup_first_run(app.handle());

            watcher::start_file_watcher(app.handle().clone(), config_dir(), cheats_dir());

            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::ShortcutState;

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::default()
                        .with_shortcut("CommandOrControl+Shift+R")?
                        .with_handler(|app, _shortcut, event| {
                            if event.state == ShortcutState::Pressed {
                                toggle_main_window(app);
                            }
                        })
                        .build(),
                )?;
            }

            #[cfg(desktop)]
            {
                use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
                use tauri::tray::TrayIconBuilder;

                let palette_item =
                    MenuItem::with_id(app, "palette", "Open Palette", true, None::<&str>)?;
                let context_item = MenuItem::with_id(
                    app,
                    "context",
                    "Open Current App Cheat",
                    true,
                    None::<&str>,
                )?;
                let settings_item =
                    MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
                let sep = PredefinedMenuItem::separator(app)?;
                let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(
                    app,
                    &[
                        &palette_item,
                        &context_item,
                        &sep,
                        &settings_item,
                        &sep,
                        &quit_item,
                    ],
                )?;

                TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .show_menu_on_left_click(true)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "palette" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                            let _ = app.emit("recall://open-palette", ());
                        }
                        "context" => show_with_context(app),
                        "settings" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                            let _ = app.emit("recall://open-settings", ());
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .build(app)?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            toggle_window,
            read_cheat_file,
            list_cheat_files,
            read_history,
            write_history,
            read_config,
            write_config,
            detect_context,
            is_first_run,
        ])
        .build(tauri::generate_context!())
        .expect("error building tauri application");

    app.run(|_app, event| {
        if let tauri::RunEvent::Exit = event {
            let _ = std::fs::remove_file(socket_path());
        }
    });
}

#[cfg(test)]
mod bundled_resource_tests {
    use super::collect_bundled_resource_files;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn collect_finds_nested_cheats_and_mappings() {
        let base = std::env::temp_dir().join(format!(
            "recall-bundled-test-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let nested = base.join("_up_").join("bundled-cheats");
        fs::create_dir_all(&nested).unwrap();
        fs::write(nested.join("git.md"), "# git").unwrap();
        fs::write(nested.join("app-mappings.yaml"), "mappings: []\n").unwrap();

        let mut paths = collect_bundled_resource_files(&base);
        paths.sort();
        assert_eq!(paths.len(), 2);
        assert!(paths[0].ends_with("app-mappings.yaml"));
        assert!(paths[1].ends_with("git.md"));

        let _ = fs::remove_dir_all(&base);
    }
}
