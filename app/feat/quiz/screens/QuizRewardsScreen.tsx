import { Alert, Button, Stack, Text } from "@mantine/core";
import { Suspense, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { useSuspenseQueries } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import { ProfileCard } from "@/shared/ui/ProfileCard";
import { mapProfileDataToUiProfile } from "@/shared/profile/profileUi";

type ExchangeStatus = "idle" | "saving" | "done" | "error";

function QuizRewardsContent() {
  const eventId = useNumericParam("eventId");
  const targetUserId = useNumericParam("targetUserId");
  const navigate = useNavigate();
  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatus>("idle");
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);

  if (!eventId || !targetUserId) {
    throw new Error("パラメータが不正です");
  }

  /* Fetch profile and check friendship status */
  const [profileData, isFriendshipExchanged] = useSuspenseQueries([
    [
      ["profiles.getUserProfile", { userId: targetUserId }],
      () => apis.profiles.getUserProfile({ userId: targetUserId }),
    ],
    [
      ["friendships.getFriendshipByOtherUser", { userId: targetUserId }],
      async () => {
        try {
          await apis.friendships.getFriendshipByOtherUser({
            otherUserId: targetUserId,
          });
          return true; // Already exchanged
        } catch (eOrP: any) {
          if (eOrP instanceof Promise) {
            throw eOrP;
          }
          // 404 means not exchanged yet.
          const s = eOrP?.status ?? eOrP?.response?.status;
          if (s !== 404) {
            throw eOrP;
          } else {
            return false; // Not exchanged
          }
        }
      },
    ],
  ]);

  const profile = mapProfileDataToUiProfile(profileData?.profileData as any);
  const displayName = profile.displayName || `ユーザー ${targetUserId}`;

  // Auto-exchange profile on mount if not already exchanged
  useEffect(() => {
    const autoExchange = async () => {
      if (isFriendshipExchanged) {
        setExchangeStatus("done");
        setExchangeMessage("プロフィールを交換しました");
        return;
      }

      setExchangeStatus("saving");
      setExchangeMessage(null);

      try {
        await apis.friendships.receiveFriendship({
          userId: targetUserId,
          receiveFriendshipRequest: {
            meta: { source: "quiz_reward", at: new Date().toISOString() },
          },
        });
        setExchangeStatus("done");
        setExchangeMessage("プロフィールを交換しました");
      } catch (e: any) {
        const s = e?.status ?? e?.response?.status;
        if (s === 409) {
          setExchangeStatus("done");
          setExchangeMessage("プロフィールを交換しました");
          return;
        }
        if (s === 404) {
          setExchangeStatus("error");
          setExchangeMessage("ユーザーが見つかりませんでした");
          return;
        }

        setExchangeStatus("error");
        setExchangeMessage(String(e?.message ?? "交換に失敗しました"));
      }
    };

    autoExchange();
  }, [targetUserId, isFriendshipExchanged]);

  // Handle next quiz navigation
  const handleNextQuiz = () => {
    try {
      const progressKey = `quiz_sequence_${eventId}`;
      const stored = sessionStorage.getItem(progressKey);
      let progress = { completedQuizzes: [] };

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.completedQuizzes)) {
          progress = parsed;
        }
      }

      // Mark current quiz as completed (avoid duplicates)
      if (!progress.completedQuizzes.includes(targetUserId)) {
        const newProgress = {
          completedQuizzes: [...progress.completedQuizzes, targetUserId],
        };
        sessionStorage.setItem(progressKey, JSON.stringify(newProgress));
      }

      // Navigate to sequence screen to continue
      navigate(`/events/${eventId}/quiz/sequence`);
    } catch (error) {
      console.error("Failed to update quiz progress:", error);
      // Navigate anyway to avoid blocking the user
      navigate(`/events/${eventId}/quiz/sequence`);
    }
  };

  return (
    <Stack gap="md">
      {exchangeMessage && (
        <Alert
          color={exchangeStatus === "error" ? "red" : "green"}
          title={exchangeStatus === "error" ? "交換エラー" : "プロフィール取得"}
        >
          <Text size="sm">{exchangeMessage}</Text>
        </Alert>
      )}

      <Alert color="blue" title="クイズクリア報酬">
        <Text size="sm">{displayName}のプロフィールカードを獲得しました！</Text>
      </Alert>

      <ProfileCard
        profile={profile}
        title={displayName}
        subtitle={`userId: ${targetUserId}`}
      />

      <Stack gap="sm">
        <Button onClick={handleNextQuiz} fullWidth>
          次のクイズへ
        </Button>
      </Stack>
    </Stack>
  );
}

export function QuizRewardsScreen() {
  return (
    <Container title="プロフィール取得">
      <ErrorBoundary
        fallback={(error, retry) => (
          <Alert color="red" title="読み込みエラー">
            <Stack gap="sm">
              <Text size="sm">{error.message}</Text>
              <Button variant="light" onClick={retry}>
                再試行
              </Button>
            </Stack>
          </Alert>
        )}
      >
        <Suspense
          fallback={
            <Text size="sm" c="dimmed">
              読み込み中...
            </Text>
          }
        >
          <QuizRewardsContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
