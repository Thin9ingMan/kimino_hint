import { Box, Text, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";

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
    } catch {
      return "";
    }
  });

  // メモの変更をlocalStorageに保存
  const handleMemoChange = (value: string) => {
    setMemoValue(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch (error) {
      console.error("Failed to save memo to localStorage:", error);
    }
  };

  // userIdが変更された時にメモをリロード
  useEffect(() => {
    try {
      const savedMemo = localStorage.getItem(storageKey) || "";
      setMemoValue(savedMemo);
    } catch {
      setMemoValue("");
    }
  }, [storageKey]);

  return (
    <Box mt="xs">
      <Text fw={700} size="sm" mb={5} style={{ color: "#065f46" }}>
        メモ
      </Text>
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
