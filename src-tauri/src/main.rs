#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.iter().any(|a| a == "--toggle") {
        match recall_lib::send_toggle() {
            Ok(()) => {}
            Err(e) => {
                eprintln!("Failed to toggle Recall: {e}");
                eprintln!("Is Recall running?");
                std::process::exit(1);
            }
        }
        return;
    }

    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("Recall — Instant recall for the tools you use every day.");
        println!();
        println!("Usage: recall [OPTIONS]");
        println!();
        println!("Options:");
        println!("  --toggle  Toggle the overlay (bind this to a compositor hotkey on Wayland)");
        println!("  --help    Show this help message");
        return;
    }

    recall_lib::run()
}
