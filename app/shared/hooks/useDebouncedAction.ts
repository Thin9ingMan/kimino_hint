import { useEffect, useRef, useState, useCallback } from "react";
import { useDebouncedValue } from "@mantine/hooks";

export type ActionStatus = "idle" | "executing" | "success" | "error";

interface UseDebouncedActionOptions<T> {
  value: T;
  onExecute: (value: T) => Promise<void>;
  enabled?: boolean; // Allow consumer to control when to execute
  debounceMs?: number;
  successTimeout?: number;
  errorTimeout?: number;
}

interface UseDebouncedActionReturn {
  status: ActionStatus;
  triggerExecute: () => void;
}

/**
 * Reusable hook for auto-executing actions with debounce and status management
 *
 * Generic hook that can be used for any debounced async action (save, submit, update, etc.)
 *
 * @param options Configuration options
 * @returns Action status and manual trigger function
 *
 * @example
 * const { status } = useDebouncedAction({
 *   value: memoText,
 *   onExecute: async (text) => {
 *     await api.saveMemo({ memo: text });
 *   },
 *   debounceMs: 500,
 * });
 */
export function useDebouncedAction<T>({
  value,
  onExecute,
  enabled = true,
  debounceMs = 500,
  successTimeout = 2000,
  errorTimeout = 3000,
}: UseDebouncedActionOptions<T>): UseDebouncedActionReturn {
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [debouncedValue] = useDebouncedValue(value, debounceMs);
  const isInitialMount = useRef(true);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasEnabled = useRef(enabled);

  const clearStatusTimer = useCallback(() => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }, []);

  // Reset initial mount flag when enabled changes from false to true
  useEffect(() => {
    if (enabled && !wasEnabled.current) {
      isInitialMount.current = true;
    }
    wasEnabled.current = enabled;
  }, [enabled]);

  // Auto-execute when debounced value changes
  useEffect(() => {
    // Skip if disabled
    if (!enabled) {
      return;
    }

    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    let isCancelled = false;

    const execute = async () => {
      setStatus("executing");
      clearStatusTimer();

      try {
        await onExecute(debouncedValue);

        if (!isCancelled) {
          setStatus("success");
          statusTimerRef.current = setTimeout(() => {
            setStatus("idle");
            statusTimerRef.current = null;
          }, successTimeout);
        }
      } catch (error) {
        console.error("Auto-execute failed:", error);
        if (!isCancelled) {
          setStatus("error");
          statusTimerRef.current = setTimeout(() => {
            setStatus("idle");
            statusTimerRef.current = null;
          }, errorTimeout);
        }
      }
    };

    execute();

    return () => {
      isCancelled = true;
      clearStatusTimer();
    };
  }, [
    debouncedValue,
    onExecute,
    enabled,
    successTimeout,
    errorTimeout,
    clearStatusTimer,
  ]);

  const triggerExecute = useCallback(async () => {
    setStatus("executing");
    clearStatusTimer();

    try {
      await onExecute(value);
      setStatus("success");
      statusTimerRef.current = setTimeout(() => {
        setStatus("idle");
        statusTimerRef.current = null;
      }, successTimeout);
    } catch (error) {
      console.error("Manual execute failed:", error);
      setStatus("error");
      statusTimerRef.current = setTimeout(() => {
        setStatus("idle");
        statusTimerRef.current = null;
      }, errorTimeout);
    }
  }, [value, onExecute, successTimeout, errorTimeout, clearStatusTimer]);

  return { status, triggerExecute };
}
