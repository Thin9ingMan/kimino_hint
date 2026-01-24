import { Box, Text, Textarea } from "@mantine/core";
import { useEffect, useState, useCallback, useRef } from "react";
import { useDebouncedValue } from "@mantine/hooks";

interface MemoFieldProps {
  userId: number;
}

/**
 * メモフィールドコンポーネント
 * 他人のプロフィールを見るときにのみ使用される
 * メモの内容はlocalStorageに保存され、ユーザーごとに個別管理される
 */
export function MemoField({ userId }: MemoFieldProps) {
  const storageKey = `profile_memo_${userId}`;
  
  // localStorageから初期値を読み込む
  const [memoValue, setMemoValue] = useState<string>(() => {
    try {
      return localStorage.getItem(storageKey) || "";
    } catch (error) {
      console.error("Failed to read memo from localStorage:", error);
      return "";
    }
  });

  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [debouncedMemoValue] = useDebouncedValue(memoValue, 500);
  const hasUserInteracted = useRef(false);

  // メモの変更時に状態を更新
  const handleMemoChange = useCallback((value: string) => {
    setMemoValue(value);
    hasUserInteracted.current = true;
    setSaveStatus("idle"); // Reset save status when user types
  }, []);

  // デバウンスされた値が変更されたときにlocalStorageに保存
  useEffect(() => {
    // Only save if user has interacted
    if (!hasUserInteracted.current) {
      return;
    }

    try {
      localStorage.setItem(storageKey, debouncedMemoValue);
      setSaveStatus("saved");
      // 2秒後に保存済み表示を消す
      const timer = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(timer);
    } catch (error) {
      console.error("Failed to save memo to localStorage:", error);
      setSaveStatus("idle");
    }
  }, [debouncedMemoValue, storageKey]);

  // userIdが変更された時にメモをリロード
  useEffect(() => {
    try {
      const savedMemo = localStorage.getItem(storageKey) || "";
      setMemoValue(savedMemo);
      setSaveStatus("idle");
      hasUserInteracted.current = false; // Reset interaction flag when userId changes
    } catch (error) {
      console.error("Failed to reload memo from localStorage:", error);
      setMemoValue("");
      setSaveStatus("idle");
    }
  }, [storageKey]);

  return (
    <Box mt="xs">
      <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <Text fw={700} size="sm" style={{ color: "#065f46" }}>
          メモ
        </Text>
        {saveStatus === "saved" && (
          <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
            保存しました
          </Text>
        )}
      </Box>
      <Textarea
        placeholder="自由に記入してください"
        value={memoValue}
        onChange={(event) => handleMemoChange(event.currentTarget.value)}
        autosize
        minRows={3}
        variant="filled"
        radius="md"
      />
    </Box>
  );
}
