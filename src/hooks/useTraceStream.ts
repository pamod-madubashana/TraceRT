import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { TraceResult } from "@/types/trace";

export type TraceLineEvent = {
  trace_id: string;
  line_no: number;
  line: string;
};

export type TraceCompleteEvent = {
  trace_id: string;
  result: TraceResult;
};

export function useTraceStream(activeTraceId: string | null) {
  const [lines, setLines] = useState<TraceLineEvent[]>([]);
  const [completion, setCompletion] = useState<TraceCompleteEvent | null>(null);
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

    let unlistenLine: UnlistenFn | null = null;
    let unlistenComplete: UnlistenFn | null = null;

    (async () => {
      try {
        // Listen for trace line events
        unlistenLine = await listen<TraceLineEvent>("trace:line", (event) => {
          // ignore events from old traces
          if (!activeIdRef.current) return;
          if (event.payload.trace_id !== activeIdRef.current) return;

          setLines((prev) => [...prev, event.payload]);
        });
        
        // Listen for trace completion events
        unlistenComplete = await listen<TraceCompleteEvent>("trace:complete", (event) => {
          // ignore events from old traces
          if (!activeIdRef.current) return;
          if (event.payload.trace_id !== activeIdRef.current) return;

          setCompletion(event.payload);
        });
        
        unlistenRef.current = unlistenLine;
      } catch (error) {
        console.error('[useTraceStream] Failed to setup event listeners:', error);
      }
    })();

    return () => {
      if (unlistenLine) {
        unlistenLine();
      }
      if (unlistenComplete) {
        unlistenComplete();
      }
    };
  }, []);

  const reset = () => {
    setLines([]);
    setCompletion(null);
  };

  return { lines, completion, reset };
}