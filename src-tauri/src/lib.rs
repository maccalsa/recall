use std::path::PathBuf;
use tauri::Manager;

fn config_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("recall")
}

fn cheats_dir() -> PathBuf {
    config_dir().join("cheats")
}

fn toggle_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
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
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read {}: {e}", path.display()))
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
                path.file_name()
                    .and_then(|n| n.to_str())
                    .map(String::from)
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
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create config directory: {e}"))?;
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

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            start_ipc_listener(app.handle().clone());

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
                use tauri::menu::{Menu, MenuItem};
                use tauri::tray::TrayIconBuilder;

                let toggle_item =
                    MenuItem::with_id(app, "toggle", "Toggle Recall", true, None::<&str>)?;
                let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&toggle_item, &quit_item])?;

                TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .show_menu_on_left_click(true)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "toggle" => toggle_main_window(app),
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
        ])
        .build(tauri::generate_context!())
        .expect("error building tauri application");

    app.run(|_app, event| {
        if let tauri::RunEvent::Exit = event {
            let _ = std::fs::remove_file(socket_path());
        }
    });
}
