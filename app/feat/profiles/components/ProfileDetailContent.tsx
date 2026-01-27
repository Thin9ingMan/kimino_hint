import { Alert, Button, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { Link, useLoaderData } from "react-router-dom";

import { apis } from "@/shared/api";
import { ProfileCard } from "@/shared/ui/ProfileCard";
import { MemoField } from "@/shared/ui/MemoField";
import { mapProfileDataToUiProfile } from "@/shared/profile/profileUi";
import { ProfileDetailScreen } from "../screens/ProfileDetailScreen";

type ExchangeStatus = "idle" | "saving" | "done" | "error";

interface ProfileDetailContentProps {
  loaderData: ReturnType<
    typeof useLoaderData<typeof ProfileDetailScreen.loader>
  >;
}

export function ProfileDetailContent({
  loaderData,
}: ProfileDetailContentProps) {
  const { userId, profileData, isFriendshipExchanged } = loaderData;

  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatus>("idle");
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);

  let alreadyExchanged = isFriendshipExchanged;
  if (exchangeStatus === "done") {
    alreadyExchanged = true;
  }

  if (loaderData.error === "not_found" || !profileData) {
    return (
      <Stack gap="md">
        <Alert color="blue" title="ユーザーが見つかりません">
          <Text size="sm">
            指定されたユーザー（ID: {userId}
            ）は存在しないか、プロフィールがまだ作成されていません。
          </Text>
        </Alert>
        <Button component={Link} to="/profiles" variant="default" fullWidth>
          プロフィール一覧へ
        </Button>
      </Stack>
    );
  }

  // Ensure profileData.profileData is treated as Record<string, unknown> | null | undefined
  // based on the generated client's return type.
  const rawProfileData = profileData.profileData;
  const profile = mapProfileDataToUiProfile(
    rawProfileData && typeof rawProfileData === "object"
      ? (rawProfileData as Record<string, unknown>)
      : null,
  );

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
    } catch (e: unknown) {
      // Manual error handling to avoid 'any'
      let status: number | undefined;
      let message = "交換に失敗しました";

      if (e && typeof e === "object" && "status" in e) {
        status = Number(e.status);
      } else if (
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "status" in e.response
      ) {
        status = Number(e.response.status);
      }

      if (e && typeof e === "object" && "message" in e) {
        message = String(e.message);
      }

      if (status === 409) {
        setExchangeStatus("done");
        setExchangeMessage("すでに交換済みです");
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
