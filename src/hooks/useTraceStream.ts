import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { TraceResult } from "@/types/trace";
import { logger } from "@/lib/logger";

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
  const lastExpectedTraceIdRef = useRef<string | null>(null); // Track the last expected trace ID
  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    if (activeTraceId) {
      activeIdRef.current = activeTraceId;
      lastExpectedTraceIdRef.current = activeTraceId; // Keep track for completion events
    } else {
      activeIdRef.current = activeTraceId;
    }
  }, [activeTraceId]);

  useEffect(() => {
    // Check if we're in Tauri environment
    const isTauriAvailable = typeof window !== 'undefined' && 
      window.__TAURI_INTERNALS__ !== undefined;

    if (!isTauriAvailable) {
      logger.warn('[useTraceStream] Tauri not available, skipping event listener setup');
      return;
    }

    logger.info('Installing trace:complete listener...');
    let unlistenLine: UnlistenFn | null = null;
    let unlistenComplete: UnlistenFn | null = null;

    (async () => {
      try {
        // Listen for trace line events
        try {
          unlistenLine = await listen<TraceLineEvent>("trace:line", (event) => {
            // ignore events from old traces
            if (!activeIdRef.current) return;
            if (event.payload.trace_id !== activeIdRef.current) return;

            setLines((prev) => [...prev, event.payload]);
          });
        } catch (error) {
          logger.error(`listen(trace:line) failed: ${error}`);
        }
        
        // Listen for trace completion events
        try {
          unlistenComplete = await listen<TraceCompleteEvent>("trace:complete", (event) => {
            logger.info(`trace:complete received trace_id=${event.payload.trace_id}`);
            
            // For completion events, check both current and last expected trace ID
            // This handles potential race conditions where activeTraceId gets reset before
            // the completion event is processed
            if (!activeIdRef.current && !lastExpectedTraceIdRef.current) {
              logger.info('[useTraceStream] Rejecting completion event - no active trace ID');
              logger.info(`[useTraceStream] activeIdRef.current: ${activeIdRef.current}`);
              logger.info(`[useTraceStream] lastExpectedTraceIdRef.current: ${lastExpectedTraceIdRef.current}`);
              return;
            }
            if (event.payload.trace_id !== activeIdRef.current && 
                event.payload.trace_id !== lastExpectedTraceIdRef.current) {
              logger.info(`[useTraceStream] Rejecting completion event - trace ID mismatch, eventTraceId: ${event.payload.trace_id}, activeId: ${activeIdRef.current}, lastExpectedId: ${lastExpectedTraceIdRef.current}`);
              return;
            }

            logger.info(`[useTraceStream] Accepting completion event for trace: ${event.payload.trace_id}`);
            setCompletion(event.payload);
          });
          logger.info('trace:complete listener installed');
        } catch (error) {
          logger.error(`listen(trace:complete) failed: ${error}`);
        }
        
        // Store both unlisten functions for proper cleanup
        unlistenRef.current = () => {
          if (unlistenLine) {
            unlistenLine();
          }
          if (unlistenComplete) {
            unlistenComplete();
          }
        };
      } catch (error) {
        logger.error('[useTraceStream] Failed to setup event listeners:', error);
      }
    })();

    return () => {
      if (unlistenRef.current && typeof unlistenRef.current === 'function') {
        unlistenRef.current();
      }
    };
  }, []);

  const reset = () => {
    setLines([]);
    setCompletion(null);
  };

  return { lines, completion, reset };
}