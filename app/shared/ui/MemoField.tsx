import { Box, Text, Textarea } from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import { apis } from "@/shared/api";
import { useDebouncedAction } from "@/shared/hooks/useDebouncedAction";

interface MemoFieldProps {
  userId: number;
  disabled?: boolean;
  disabledMessage?: string;
}

/**
 * メモフィールドコンポーネント
 * 他人のプロフィールを見るときにのみ使用される
 * メモの内容はバックエンドAPIに保存され、ユーザーごとに個別管理される
 */
export function MemoField({
  userId,
  disabled = false,
  disabledMessage,
}: MemoFieldProps) {
  const [memoValue, setMemoValue] = useState<string>("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // バックエンドからメモを読み込む（友情交換済みの場合のみ）
  useEffect(() => {
    // If disabled (no friendship), skip loading
    if (disabled) {
      setHasLoadedOnce(true);
      return;
    }

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
  }, [userId, disabled]);

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
    [userId],
  );

  const { status } = useDebouncedAction({
    value: memoValue,
    onExecute: handleSave,
    enabled: hasLoadedOnce && !disabled, // Only enable auto-save after initial load and when not disabled
    debounceMs: 500,
    successTimeout: 2000,
    errorTimeout: 3000,
  });

  const handleMemoChange = useCallback((value: string) => {
    setMemoValue(value);
  }, []);

  return (
    <Box mt="xs">
      <Box
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 5,
        }}
      >
        <Text fw={700} size="sm" style={{ color: "#065f46" }}>
          メモ
        </Text>
        {status === "executing" && (
          <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
            保存中...
          </Text>
        )}
        {status === "success" && (
          <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
            保存しました
          </Text>
        )}
        {status === "error" && (
          <Text size="xs" c="red" style={{ fontStyle: "italic" }}>
            保存に失敗しました
          </Text>
        )}
      </Box>
      <Textarea
        placeholder={
          disabled
            ? disabledMessage || "プロフィール交換後に入力できます"
            : "自由に記入してください"
        }
        value={memoValue}
        onChange={(event) => handleMemoChange(event.currentTarget.value)}
        disabled={disabled}
        autosize
        minRows={3}
        variant="filled"
        radius="md"
      />
    </Box>
  );
}
