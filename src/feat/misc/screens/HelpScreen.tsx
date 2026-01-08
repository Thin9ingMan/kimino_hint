import { Alert, List, Stack, Text, Title } from "@mantine/core";
import { Container } from "@/shared/ui/Container";
import { Anchor } from "@mantine/core";

const pageList = [
  { path: "/home", label: "ホーム" },
  { path: "/help", label: "使い方 (この画面)" },
  { path: "/me", label: "マイページ" },
  { path: "/me/profile", label: "自分のプロフィール" },
  { path: "/me/profile/edit", label: "プロフィール編集" },
  { path: "/profiles", label: "受け取ったプロフィール一覧" },
  { path: "/profiles/:userId", label: "プロフィール詳細 (受け取った相手)" },
  { path: "/events", label: "イベント一覧" },
  { path: "/events/new", label: "イベント作成" },
  { path: "/events/join", label: "イベント参加 (招待コード入力)" },
  { path: "/events/:eventId", label: "イベントロビー" },
  { path: "/events/:eventId/live", label: "イベントライブ更新" },
  { path: "/events/:eventId/quiz", label: "クイズイントロ" },
  { path: "/events/:eventId/quiz/:questionNo", label: "クイズ問題" },
  { path: "/events/:eventId/quiz/:questionNo/answer", label: "クイズ回答" },
  { path: "/events/:eventId/result", label: "クイズ結果" },
  { path: "/qr", label: "QRコードハブ" },
  { path: "/qr/profile", label: "自分のQRを表示" },
  { path: "/qr/scan", label: "QRを読み取る" },
  // Legacy redirects
  { path: "/room", label: "(旧) ルーム → /events/join" },
  { path: "/my_profile", label: "(旧) マイプロフィール → /me/profile" },
  { path: "/edit_profile", label: "(旧) プロフィール編集 → /me/profile/edit" },
  { path: "/profile_history", label: "(旧) プロフィール履歴 → /me/friendships/received" },
  { path: "/read_qr", label: "(旧) QR読み取り → /qr/scan" },
  { path: "/make_qr", label: "(旧) QR作成 → /qr/profile" },
  { path: "/profile", label: "(旧) プロフィール → /me/profile" },
  { path: "/make_question", label: "(旧) 問題作成 → /events/new" },
  { path: "/question", label: "(旧) クイズ問題リダイレクト" },
  { path: "/answer", label: "(旧) クイズ回答リダイレクト" },
  { path: "/result", label: "(旧) クイズ結果リダイレクト" },
  { path: "/legacy", label: "レガシーポータル" },
  { path: "/make_false_selection", label: "誤答選択 (旧)" },
];

export function HelpScreen() {
  return (
    <Container title="使い方">
      <Stack gap="md">
        <Alert color="blue" title="このアプリでできること">
          <Text size="sm">
            プロフィールを作って、イベント（クイズ）に参加し、プロフィール交換をします。
          </Text>
        </Alert>

        <Title order={3}>基本の流れ</Title>
        <List spacing="xs">
          <List.Item>まず「自分のプロフィール」を作成</List.Item>
          <List.Item>イベントに参加（招待コード入力）</List.Item>
          <List.Item>クイズに回答</List.Item>
          <List.Item>QR を読み取ってプロフィール交換</List.Item>
        </List>

        <Title order={3}>画面一覧</Title>
        <List spacing="xs">
          {pageList.map((page) => (
            <List.Item key={page.path}>
              <Anchor href={page.path}>{page.label}</Anchor>
            </List.Item>
          ))}
        </List>
      </Stack>
    </Container>
  );
}
