import {
  Alert,
  Stack,
  Text,
  Title,
  Button,
  Modal,
  TextInput,
  Accordion,
  Pill,
} from "@mantine/core";
import { Container } from "@/shared/ui/Container";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const normalPages = [
  { path: "/home", label: "ホーム" },
  { path: "/help", label: "使い方 (この画面)" },
  { path: "/me", label: "マイページ" },
  { path: "/me/profile", label: "自分のプロフィール" },
  { path: "/me/profile/edit", label: "プロフィール編集" },
  { path: "/profiles", label: "受け取ったプロフィール一覧" },
  {
    path: "/profiles/:userId",
    label: "プロフィール詳細 (受け取った相手)",
    params: ["userId"],
  },
  { path: "/events", label: "イベント一覧" },
  { path: "/events/new", label: "イベント作成" },
  { path: "/events/join", label: "イベント参加 (招待コード入力)" },
  { path: "/events/:eventId", label: "イベントロビー", params: ["eventId"] },
  {
    path: "/events/:eventId/live",
    label: "イベントライブ更新",
    params: ["eventId"],
  },
  {
    path: "/events/:eventId/quiz",
    label: "クイズイントロ",
    params: ["eventId"],
  },
  {
    path: "/events/:eventId/quiz/:questionNo",
    label: "クイズ問題",
    params: ["eventId", "questionNo"],
  },
  {
    path: "/events/:eventId/quiz/:questionNo/answer",
    label: "クイズ回答",
    params: ["eventId", "questionNo"],
  },
  { path: "/events/:eventId/result", label: "クイズ結果", params: ["eventId"] },
  { path: "/qr", label: "QRコードハブ" },
  { path: "/qr/profile", label: "自分のQRを表示" },
  { path: "/qr/scan", label: "QRを読み取る" },
];

const legacyPages = [
  { path: "/room", label: "(旧) ルーム → /events/join" },
  { path: "/my_profile", label: "(旧) マイプロフィール → /me/profile" },
  { path: "/edit_profile", label: "(旧) プロフィール編集 → /me/profile/edit" },
  {
    path: "/profile_history",
    label: "(旧) プロフィール履歴 → /me/friendships/received",
  },
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

function hasParams(page: {
  path: string;
  label: string;
  params?: string[];
}): page is { path: string; label: string; params: string[] } {
  return Array.isArray((page as any).params);
}

function ParamModal({
  opened,
  onClose,
  path,
  params,
  navigate,
}: {
  opened: boolean;
  onClose: () => void;
  path: string;
  params: string[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(params.map((p) => [p, ""]))
  );
  const handleChange = (param: string, value: string) => {
    setValues((v) => ({ ...v, [param]: value }));
  };
  const isFilled = params.every((p) => values[p]);
  const genPath = () => {
    let url = path;
    params.forEach((p) => {
      url = url.replace(`:${p}`, values[p]);
    });
    return url;
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isFilled) {
      navigate(genPath());
    }
  };
  return (
    <Modal opened={opened} onClose={onClose} title="パラメータ入力" centered>
      <Stack gap="xs">
        {params.map((param) => (
          <TextInput
            key={param}
            label={param}
            value={values[param]}
            onChange={(e) => handleChange(param, e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            autoFocus={param === params[0]}
          />
        ))}
        <Text size="xs" c="dimmed">
          全て入力後、Enterキーで遷移します
        </Text>
      </Stack>
    </Modal>
  );
}

export function HelpScreen() {
  const [modal, setModal] = useState<{ path: string; params: string[] } | null>(
    null
  );
  const [showDevList, setShowDevList] = useState(false);
  const navigate = useNavigate();

  return (
    <Container title="使い方">
      <Stack gap="md">
        <Alert color="blue" title="このアプリでできること">
          <Text size="sm">
            プロフィールを作って、イベント（クイズ）に参加し、プロフィール交換をします。
          </Text>
        </Alert>

        <Title order={3}>基本の流れ</Title>
        <Stack gap="xs">
          <Text>まず「自分のプロフィール」を作成</Text>
          <Text>イベントに参加（招待コード入力）</Text>
          <Text>クイズに回答</Text>
          <Text>QR を読み取ってプロフィール交換</Text>
        </Stack>

        <Button
          size="xs"
          variant="outline"
          color="gray"
          onClick={() => setShowDevList((v) => !v)}
        >
          {showDevList ? "ページリストを隠す" : "ページリスト（開発用）を表示"}
        </Button>

        {showDevList && (
          <Accordion variant="contained" defaultValue={"normal"}>
            <Accordion.Item value="normal">
              <Accordion.Control>通常ページ</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  {normalPages.map((page) =>
                    hasParams(page) ? (
                      <Button
                        key={page.path}
                        variant="light"
                        onClick={() =>
                          setModal({ path: page.path, params: page.params })
                        }
                      >
                        {page.label}
                        <Pill size="xs" variant="outline">
                          {page.path}
                        </Pill>
                      </Button>
                    ) : (
                      <Button
                        key={page.path}
                        variant="light"
                        component={Link}
                        to={page.path}
                      >
                        {page.label}
                        <Pill size="xs" variant="outline">
                          {page.path}
                        </Pill>
                      </Button>
                    )
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="legacy">
              <Accordion.Control>レガシーリダイレクト</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  {legacyPages.map((page) =>
                    hasParams(page) ? (
                      <Button
                        key={page.path}
                        variant="light"
                        onClick={() =>
                          setModal({ path: page.path, params: page.params })
                        }
                      >
                        {page.label}
                      </Button>
                    ) : (
                      <Button
                        key={page.path}
                        variant="light"
                        onClick={() => navigate(page.path)}
                      >
                        {page.label}
                      </Button>
                    )
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        )}

        {modal && (
          <ParamModal
            opened={!!modal}
            onClose={() => setModal(null)}
            path={modal.path}
            params={modal.params}
            navigate={navigate}
          />
        )}
      </Stack>
    </Container>
  );
}
