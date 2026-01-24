import { Box, Text, Textarea } from "@mantine/core";
import { useEffect, useState, useCallback, useRef } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { apis } from "@/shared/api";

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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [debouncedMemoValue] = useDebouncedValue(memoValue, 500);
  const hasUserInteracted = useRef(false);
  const saveIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

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
          isInitialLoad.current = false;
        }
      } catch (error: any) {
        // 404 means no friendship meta exists yet, which is fine
        const status = error?.status ?? error?.response?.status;
        if (status !== 404) {
          console.error("Failed to load memo from backend:", error);
        }
        if (!isCancelled) {
          isInitialLoad.current = false;
        }
      }
    };

    loadMemo();
    hasUserInteracted.current = false;

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  // メモの変更時に状態を更新
  const handleMemoChange = useCallback((value: string) => {
    setMemoValue(value);
    hasUserInteracted.current = true;
    setSaveStatus("idle");
    // Clear any existing save indicator timer
    if (saveIndicatorTimer.current) {
      clearTimeout(saveIndicatorTimer.current);
      saveIndicatorTimer.current = null;
    }
  }, []);

  // デバウンスされた値が変更されたときにバックエンドに保存
  useEffect(() => {
    // Skip if:
    // - User hasn't interacted
    // - Still loading initial data
    if (!hasUserInteracted.current || isInitialLoad.current) {
      return;
    }

    let isCancelled = false;

    const saveMemo = async () => {
      setSaveStatus("saving");

      try {
        await apis.friendships.updateFriendshipMeta({
          otherUserId: userId,
          userMeta: {
            usermeta: {
              memo: debouncedMemoValue,
            },
          },
        });

        if (!isCancelled) {
          setSaveStatus("saved");
          // Clear any existing timer before creating a new one
          if (saveIndicatorTimer.current) {
            clearTimeout(saveIndicatorTimer.current);
          }
          // 2秒後に保存済み表示を消す
          saveIndicatorTimer.current = setTimeout(() => {
            setSaveStatus("idle");
            saveIndicatorTimer.current = null;
          }, 2000);
        }
      } catch (error) {
        console.error("Failed to save memo to backend:", error);
        if (!isCancelled) {
          setSaveStatus("error");
          // Clear error status after 3 seconds
          if (saveIndicatorTimer.current) {
            clearTimeout(saveIndicatorTimer.current);
          }
          saveIndicatorTimer.current = setTimeout(() => {
            setSaveStatus("idle");
            saveIndicatorTimer.current = null;
          }, 3000);
        }
      }
    };

    saveMemo();

    return () => {
      isCancelled = true;
      if (saveIndicatorTimer.current) {
        clearTimeout(saveIndicatorTimer.current);
        saveIndicatorTimer.current = null;
      }
    };
  }, [debouncedMemoValue, userId]);

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
