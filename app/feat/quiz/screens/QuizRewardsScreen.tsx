import { Alert, Button, Stack, Text } from "@mantine/core";
import { Suspense, useState, useEffect } from "react";
import { useNavigate, useLoaderData } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { apis, AppError } from "@/shared/api";
import { ProfileCard } from "@/shared/ui/ProfileCard";
import { mapProfileDataToUiProfile } from "@/shared/profile/profileUi";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";

type ExchangeStatus = "idle" | "saving" | "done" | "error";

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function loader({
  params,
}: {
  params: { eventId?: string; targetUserId?: string };
}) {
  const eventId = Number(params.eventId);
  const targetUserId = Number(params.targetUserId);

  if (Number.isNaN(eventId) || Number.isNaN(targetUserId)) {
    throw new AppError("パラメータが不正です", { recoveryUrl: "/events" });
  }

  try {
    const [profileData, isFriendshipExchanged] = await Promise.all([
      apis.profiles.getUserProfile({ userId: targetUserId }),
      (async () => {
        try {
          await apis.friendships.getFriendshipByOtherUser({
            otherUserId: targetUserId,
          });
          return true; // Already exchanged
        } catch (e: unknown) {
          if (e instanceof ResponseError && e.response.status === 404) {
            return false; // Not exchanged
          }
          throw e;
        }
      })(),
    ]);

    return { eventId, targetUserId, profileData, isFriendshipExchanged };
  } catch (error) {
    throw new AppError("報酬の読み込みに失敗しました", {
      cause: error,
      recoveryUrl: `/events/${eventId}/quiz/challenges`,
    });
  }
}

function QuizRewardsContent() {
  const { eventId, targetUserId, profileData, isFriendshipExchanged } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatus>("idle");
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);

  const profile = mapProfileDataToUiProfile(
    isRecord(profileData.profileData) ? profileData.profileData : {},
  );
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
      } catch (e: unknown) {
        let status = 0;
        let message = "交換に失敗しました";
        if (e instanceof ResponseError) {
          status = e.response.status;
          message = e.message;
        }

        if (status === 409) {
          setExchangeStatus("done");
          setExchangeMessage("プロフィールを交換しました");
          return;
        }
        if (status === 404) {
          setExchangeStatus("error");
          setExchangeMessage("ユーザーが見つかりませんでした");
          return;
        }

        setExchangeStatus("error");
        setExchangeMessage(message);
      }
    };

    autoExchange();
  }, [targetUserId, isFriendshipExchanged]);

  // Handle next quiz navigation
  const handleNextQuiz = () => {
    try {
      const progressKey = `quiz_sequence_${eventId}`;
      const stored = sessionStorage.getItem(progressKey);
      let progress: { completedQuizzes: number[] } = { completedQuizzes: [] };

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
      <Suspense
        fallback={
          <Text size="sm" c="dimmed">
            読み込み中...
          </Text>
        }
      >
        <QuizRewardsContent />
      </Suspense>
    </Container>
  );
}

QuizRewardsScreen.loader = loader;

