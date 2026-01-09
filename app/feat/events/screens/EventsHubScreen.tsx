import { Stack } from "@mantine/core";
import { Link } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { InfoAlert } from "@/shared/ui/InfoAlert";
import { NavigationButtonList } from "@/shared/ui/NavigationButtonList";
import { InvitationCodeInput } from "@/feat/events/components/InvitationCodeInput";

export function EventsHubScreen() {
  const buttons = [
    {
      label: "イベントを作成",
      to: "/events/new",
      variant: "filled" as const,
    },
    {
      label: "イベントに参加（招待コード）",
      to: "/events/join",
      variant: "light" as const,
    },
    {
      label: "ホームへ",
      to: "/home",
      variant: "default" as const,
    },
  ];

  return (
    <Container title="イベント">
      <Stack gap="md">
        <InfoAlert title="イベントって？">
          イベント = クイズセッション（ルーム）です。参加者が集まってクイズを進めます。
        </InfoAlert>

        <NavigationButtonList buttons={buttons} />

        <InvitationCodeInput
          label="招待コード（ショートカット）"
          placeholder="例: QUIZ-2025-01"
          buttonText="このコードで参加する"
          navigateTo="/events/join"
          includeStateData
        />
      </Stack>
    </Container>
  );
}
