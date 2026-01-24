import { Box, Text, Textarea } from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import { apis } from "@/shared/api";
import { useAutoSave } from "@/shared/hooks/useAutoSave";

interface MemoFieldProps {
  userId: number;
}

/**
 * メモフィールドコンポーネント
 * 他人のプロフィールを見るときにのみ使用される
 * メモの内容はバックエンドAPIに保存され、ユーザーごとに個別管理される
 */
export function MemoField({ userId }: MemoFieldProps) {
  const [memoValue, setMemoValue] = useState<string>("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // バックエンドからメモを読み込む
  useEffect(() => {
    let isCancelled = false;

    const loadMemo = async () => {
      try {
        const meta = await apis.friendships.getFriendshipMeta({
          otherUserId: userId,
        });
        
        if (!isCancelled) {
          const memo = meta?.usermeta?.memo;
          setMemoValue(typeof memo === "string" ? memo : "");
          setHasLoadedOnce(true);
        }
      } catch (error: any) {
        // 404 means no friendship meta exists yet, which is fine
        const status = error?.status ?? error?.response?.status;
        if (status !== 404) {
          console.error("Failed to load memo from backend:", error);
        }
        if (!isCancelled) {
          setHasLoadedOnce(true);
        }
      }
    };

    loadMemo();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  // 自動保存ロジックを再利用可能なフックに委譲
  const handleSave = useCallback(
    async (memo: string) => {
      await apis.friendships.updateFriendshipMeta({
        otherUserId: userId,
        userMeta: {
          usermeta: { memo },
        },
      });
    },
    [userId]
  );

  const { saveStatus } = useAutoSave({
    value: memoValue,
    onSave: handleSave,
    enabled: hasLoadedOnce, // Only enable auto-save after initial load
    debounceMs: 500,
    savedTimeout: 2000,
    errorTimeout: 3000,
  });

  const handleMemoChange = useCallback((value: string) => {
    setMemoValue(value);
  }, []);

  return (
    <Box mt="xs">
      <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <Text fw={700} size="sm" style={{ color: "#065f46" }}>
          メモ
        </Text>
        {saveStatus === "saving" && (
          <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
            保存中...
          </Text>
        )}
        {saveStatus === "saved" && (
          <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
            保存しました
          </Text>
        )}
        {saveStatus === "error" && (
          <Text size="xs" c="red" style={{ fontStyle: "italic" }}>
            保存に失敗しました
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
