import { invoke } from "@tauri-apps/api/core";

const isTauri = () => typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window);

async function log(cmd: string, message: string, context?: any) {
  // Always log locally
  // eslint-disable-next-line no-console
  console.log(`[${cmd}]`, message, context ?? "");

  // Also log to Rust if running in Tauri
  if (!isTauri()) return;

  try {
    await invoke(cmd, { message, context: context ?? null });
  } catch {
    // ignore if invoke unavailable in browser dev
  }
}

export const logger = {
  debug: (message: string, context?: any) => log("log_debug", message, context),
  info: (message: string, context?: any) => log("log_info", message, context),
  warn: (message: string, context?: any) => log("log_warn", message, context),
  error: (message: string, context?: any) => log("log_error", message, context),
};
