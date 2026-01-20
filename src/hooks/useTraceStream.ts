import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

export type TraceLineEvent = {
  trace_id: string;
  line_no: number;
  line: string;
};

export function useTraceStream(activeTraceId: string | null) {
  const [lines, setLines] = useState<TraceLineEvent[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    activeIdRef.current = activeTraceId;
  }, [activeTraceId]);

  useEffect(() => {
    // Check if we're in Tauri environment
    const isTauriAvailable = typeof window !== 'undefined' && 
      window.__TAURI_INTERNALS__ !== undefined;

    if (!isTauriAvailable) {
      console.warn('[useTraceStream] Tauri not available, skipping event listener setup');
      return;
    }

    let unlisten: UnlistenFn | null = null;

    (async () => {
      try {
        unlisten = await listen<TraceLineEvent>("trace:line", (event) => {
          // ignore events from old traces
          if (!activeIdRef.current) return;
          if (event.payload.trace_id !== activeIdRef.current) return;

          setLines((prev) => [...prev, event.payload]);
        });
        unlistenRef.current = unlisten;
      } catch (error) {
        console.error('[useTraceStream] Failed to setup event listener:', error);
      }
    })();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const reset = () => setLines([]);

  return { lines, reset };
}