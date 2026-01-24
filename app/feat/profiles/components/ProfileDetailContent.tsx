import { Alert, Button, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { Link } from "react-router-dom";

import { apis } from "@/shared/api";
import { ProfileCard } from "@/shared/ui/ProfileCard";
import { MemoField } from "@/shared/ui/MemoField";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { mapProfileDataToUiProfile } from "@/shared/profile/profileUi";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";

type ExchangeStatus = "idle" | "saving" | "done" | "error";

export function ProfileDetailContent() {
  const userId = useNumericParam("userId");
  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatus>("idle");
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);

  if (!userId) {
    throw new Error("userId が不正です");
  }

  const profileData = useSuspenseQuery(
    ["profiles.getUserProfile", { userId }],
    () => apis.profiles.getUserProfile({ userId }),
    false
  );

  const isFriendshipExchanged = useSuspenseQuery(
    ["friendships.getFriendshipByOtherUser", { userId }],
    async () => {
      try {
        await apis.friendships.getFriendshipByOtherUser({
          otherUserId: userId,
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
    true
  );

  let alreadyExchanged = isFriendshipExchanged;
  if (exchangeStatus === "done") {
    alreadyExchanged = true;
  }

  const profile = mapProfileDataToUiProfile(profileData?.profileData as any);

  const isExchanged = exchangeStatus === "done" || alreadyExchanged;
  const shareBack = async () => {
    if (alreadyExchanged) {
      setExchangeStatus("done");
      setExchangeMessage("すでに交換済みです");
      return;
    }

    setExchangeStatus("saving");
    setExchangeMessage(null);

    try {
      await apis.friendships.receiveFriendship({
        userId,
        receiveFriendshipRequest: {
          meta: { source: "profiles_detail", at: new Date().toISOString() },
        },
      });
      setExchangeStatus("done");
      setExchangeMessage("プロフィールを交換しました");
    } catch (e: any) {
      const s = e?.status ?? e?.response?.status;
      if (s === 409) {
        setExchangeStatus("done");
        setExchangeMessage("すでに交換済みです");
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

  return (
    <Stack gap="md">
      {exchangeMessage && (
        <Alert
          color={exchangeStatus === "error" ? "red" : "green"}
          title={exchangeStatus === "error" ? "交換エラー" : "成功"}
        >
          <Text size="sm">{exchangeMessage}</Text>
        </Alert>
      )}

      <ProfileCard
        profile={profile}
        title={profile.displayName || `ユーザー ${userId}`}
        subtitle={`userId: ${userId}`}
      />

      <MemoField 
        userId={userId} 
        disabled={!isExchanged}
        disabledMessage="プロフィール交換後に入力できます"
      />

      <Stack gap="sm">
        <Button
          onClick={shareBack}
          fullWidth
          loading={exchangeStatus === "saving"}
          disabled={isExchanged}
        >
          {isExchanged ? "交換済み" : "プロフィールを交換する"}
        </Button>

        <Button component={Link} to="/profiles" variant="default" fullWidth>
          プロフィール一覧へ
        </Button>
      </Stack>
    </Stack>
  );
}
