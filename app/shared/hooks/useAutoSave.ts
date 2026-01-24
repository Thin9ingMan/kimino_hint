import { useEffect, useRef, useState, useCallback } from "react";
import { useDebouncedValue } from "@mantine/hooks";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  enabled?: boolean; // Allow consumer to control when to save
  debounceMs?: number;
  savedTimeout?: number;
  errorTimeout?: number;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  triggerSave: () => void;
}

/**
 * Reusable hook for auto-saving data with debounce and status management
 * 
 * @param options Configuration options
 * @returns Save status and manual trigger function
 * 
 * @example
 * const { saveStatus } = useAutoSave({
 *   value: memoText,
 *   onSave: async (text) => {
 *     await api.saveMemo({ memo: text });
 *   },
 *   debounceMs: 500,
 * });
 */
export function useAutoSave<T>({
  value,
  onSave,
  enabled = true,
  debounceMs = 500,
  savedTimeout = 2000,
  errorTimeout = 3000,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
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

  // Auto-save when debounced value changes
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

    const save = async () => {
      setSaveStatus("saving");
      clearStatusTimer();

      try {
        await onSave(debouncedValue);

        if (!isCancelled) {
          setSaveStatus("saved");
          statusTimerRef.current = setTimeout(() => {
            setSaveStatus("idle");
            statusTimerRef.current = null;
          }, savedTimeout);
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
        if (!isCancelled) {
          setSaveStatus("error");
          statusTimerRef.current = setTimeout(() => {
            setSaveStatus("idle");
            statusTimerRef.current = null;
          }, errorTimeout);
        }
      }
    };

    save();

    return () => {
      isCancelled = true;
      clearStatusTimer();
    };
  }, [debouncedValue, onSave, enabled, savedTimeout, errorTimeout, clearStatusTimer]);

  const triggerSave = useCallback(async () => {
    setSaveStatus("saving");
    clearStatusTimer();

    try {
      await onSave(value);
      setSaveStatus("saved");
      statusTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
        statusTimerRef.current = null;
      }, savedTimeout);
    } catch (error) {
      console.error("Manual save failed:", error);
      setSaveStatus("error");
      statusTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
        statusTimerRef.current = null;
      }, errorTimeout);
    }
  }, [value, onSave, savedTimeout, errorTimeout, clearStatusTimer]);

  return { saveStatus, triggerSave };
}
