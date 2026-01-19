use std::process::Command;
use regex::Regex;
use std::time::Duration;
use std::process::Stdio;
use std::io::Read;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![run_traceroute])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn run_traceroute(target: String) -> Result<String, String> {
    // Validate target input
    if !is_valid_target(&target) {
        return Err("Invalid target: must contain only letters, digits, dots, dashes, colons, and underscores. Max 255 characters.".to_string());
    }

    // Execute OS-specific traceroute command using Tokio
    use tokio::process::Command;
    use tokio::time::{timeout, Duration};
    
    let output = match std::env::consts::OS {
        "windows" => {
            // Windows: tracert -d <target>
            match timeout(
                Duration::from_secs(30),
                Command::new("tracert").args(["-d", &target]).output()
            ).await {
                Ok(Ok(output)) => output,
                Ok(Err(e)) => return Err(format!("Failed to execute tracert: {}", e)),
                Err(_) => return Err("Traceroute command timed out after 30 seconds".to_string()),
            }
        }
        _ => {
            // Unix-like systems: try traceroute first, fallback to tracepath
            match timeout(
                Duration::from_secs(30),
                Command::new("traceroute").arg(&target).output()
            ).await {
                Ok(Ok(output)) => output,
                Ok(Err(_)) => {
                    // Fallback to tracepath
                    match timeout(
                        Duration::from_secs(30),
                        Command::new("tracepath").arg(&target).output()
                    ).await {
                        Ok(Ok(output)) => output,
                        Ok(Err(e)) => return Err(format!("Failed to execute traceroute or tracepath: {}", e)),
                        Err(_) => return Err("Traceroute command timed out after 30 seconds".to_string()),
                    }
                }
                Err(_) => return Err("Traceroute command timed out after 30 seconds".to_string()),
            }
        }
    };

    // Check exit status and return appropriate result
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).into_owned())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Traceroute failed: {}", stderr))
    }
}

fn is_valid_target(target: &str) -> bool {
    // Check length
    if target.is_empty() || target.len() > 255 {
        return false;
    }

    // Allow only letters, digits, dots, dashes, colons (IPv6), and underscores
    // This covers domains, IPv4, IPv6 addresses
    let valid_chars = Regex::new(r"^[a-zA-Z0-9.\-:_]+$").unwrap();
    
    // Additional checks for common invalid patterns
    let has_invalid_chars = Regex::new(r"[^a-zA-Z0-9.\-:_]").unwrap();
    
    valid_chars.is_match(target) && !has_invalid_chars.is_match(target)
}