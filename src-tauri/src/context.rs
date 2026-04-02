use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

// ── Payload emitted to the frontend on every show ──

#[derive(Debug, Clone, Serialize)]
pub struct ContextPayload {
    pub window_class: Option<String>,
    pub mapped_cheat: Option<String>,
    pub is_double_press: bool,
}

// ── Active window detection (strategy pattern) ──

pub fn detect_active_window() -> Option<String> {
    let session = std::env::var("XDG_SESSION_TYPE").unwrap_or_default();
    match session.to_lowercase().as_str() {
        "x11" => detect_x11(),
        "wayland" => detect_wayland(),
        _ => detect_x11().or_else(detect_wayland),
    }
}

fn run_command(cmd: &str, args: &[&str]) -> Option<String> {
    Command::new(cmd)
        .args(args)
        .output()
        .ok()
        .filter(|o| o.status.success())
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

fn detect_x11() -> Option<String> {
    let window_id = run_command("xdotool", &["getactivewindow"])?;
    let wm_class_line = run_command("xprop", &["-id", &window_id, "WM_CLASS"])?;
    // xprop output: WM_CLASS(STRING) = "instance", "ClassName"
    // Extract the second (class) value
    wm_class_line
        .rsplit('"')
        .nth(1)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
}

fn detect_wayland() -> Option<String> {
    detect_sway()
        .or_else(detect_hyprland)
        .or_else(detect_gnome)
}

fn detect_sway() -> Option<String> {
    if std::env::var("SWAYSOCK").is_err() {
        return None;
    }
    let json = run_command("swaymsg", &["-t", "get_tree"])?;
    extract_sway_focused(&json)
}

fn extract_sway_focused(json: &str) -> Option<String> {
    let tree: serde_json::Value = serde_json::from_str(json).ok()?;
    find_sway_focused_node(&tree)
}

fn find_sway_focused_node(node: &serde_json::Value) -> Option<String> {
    if node.get("focused")?.as_bool()? {
        return node
            .get("app_id")
            .and_then(|v| v.as_str())
            .or_else(|| {
                node.get("window_properties")
                    .and_then(|wp| wp.get("class"))
                    .and_then(|v| v.as_str())
            })
            .map(|s| s.to_string());
    }
    for child in node.get("nodes")?.as_array()? {
        if let Some(found) = find_sway_focused_node(child) {
            return Some(found);
        }
    }
    for child in node.get("floating_nodes").and_then(|v| v.as_array()).unwrap_or(&vec![]) {
        if let Some(found) = find_sway_focused_node(child) {
            return Some(found);
        }
    }
    None
}

fn detect_hyprland() -> Option<String> {
    if std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_err() {
        return None;
    }
    let json = run_command("hyprctl", &["activewindow", "-j"])?;
    let val: serde_json::Value = serde_json::from_str(&json).ok()?;
    val.get("class")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
}

fn detect_gnome() -> Option<String> {
    if std::env::var("XDG_CURRENT_DESKTOP")
        .unwrap_or_default()
        .to_lowercase()
        .contains("gnome")
        == false
    {
        return None;
    }
    let script = r#"
        const start = Date.now();
        const wins = global.get_window_actors();
        let focused = null;
        for (let w of wins) {
            if (w.meta_window.has_focus()) {
                focused = w.meta_window.get_wm_class();
                break;
            }
        }
        focused || '';
    "#;
    let output = run_command(
        "gdbus",
        &[
            "call",
            "--session",
            "--dest",
            "org.gnome.Shell",
            "--object-path",
            "/org/gnome/Shell",
            "--method",
            "org.gnome.Shell.Eval",
            script,
        ],
    )?;
    // gdbus returns: (true, 'ClassName')
    let start = output.find('\'')? + 1;
    let end = output.rfind('\'')?;
    if start >= end {
        return None;
    }
    let class = &output[start..end];
    if class.is_empty() { None } else { Some(class.to_string()) }
}

// ── App-to-cheat-sheet mapping ──

#[derive(Debug, Deserialize)]
pub struct AppMappings {
    #[serde(default)]
    pub mappings: Vec<MappingEntry>,
}

#[derive(Debug, Deserialize)]
pub struct MappingEntry {
    #[serde(rename = "match")]
    pub match_patterns: Vec<String>,
    pub cheat: String,
}

pub fn load_mappings(config_dir: &PathBuf) -> AppMappings {
    let path = config_dir.join("app-mappings.yaml");
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|contents| serde_yaml::from_str(&contents).ok())
        .unwrap_or(AppMappings {
            mappings: Vec::new(),
        })
}

pub fn resolve_mapping(mappings: &AppMappings, window_class: &str) -> Option<String> {
    let lower = window_class.to_lowercase();
    for entry in &mappings.mappings {
        for pattern in &entry.match_patterns {
            if pattern.to_lowercase() == lower {
                return Some(format!("{}.md", entry.cheat));
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_mappings() -> AppMappings {
        let yaml = r#"
mappings:
  - match: ["code", "Code", "visual studio code"]
    cheat: vscode
  - match: ["kitty", "alacritty", "foot", "gnome-terminal"]
    cheat: terminal
  - match: ["Slack", "slack"]
    cheat: slack
  - match: ["firefox", "Firefox"]
    cheat: firefox
"#;
        serde_yaml::from_str(yaml).unwrap()
    }

    #[test]
    fn resolve_exact_match() {
        let m = test_mappings();
        assert_eq!(resolve_mapping(&m, "code"), Some("vscode.md".to_string()));
    }

    #[test]
    fn resolve_case_insensitive() {
        let m = test_mappings();
        assert_eq!(resolve_mapping(&m, "CODE"), Some("vscode.md".to_string()));
        assert_eq!(
            resolve_mapping(&m, "Kitty"),
            Some("terminal.md".to_string())
        );
    }

    #[test]
    fn resolve_no_match() {
        let m = test_mappings();
        assert_eq!(resolve_mapping(&m, "unknown-app"), None);
    }

    #[test]
    fn resolve_multiple_patterns() {
        let m = test_mappings();
        assert_eq!(
            resolve_mapping(&m, "alacritty"),
            Some("terminal.md".to_string())
        );
        assert_eq!(resolve_mapping(&m, "foot"), Some("terminal.md".to_string()));
    }

    #[test]
    fn empty_mappings_returns_none() {
        let m = AppMappings {
            mappings: Vec::new(),
        };
        assert_eq!(resolve_mapping(&m, "code"), None);
    }

    #[test]
    fn parse_yaml_roundtrip() {
        let m = test_mappings();
        assert_eq!(m.mappings.len(), 4);
        assert_eq!(m.mappings[0].cheat, "vscode");
        assert_eq!(m.mappings[0].match_patterns.len(), 3);
    }
}
