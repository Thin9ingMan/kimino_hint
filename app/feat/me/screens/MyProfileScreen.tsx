import {
  Alert,
  Button,
  Group,
  Image,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { Container } from "@/shared/ui/Container";
import { ProfileCard, ProfileCardActions } from "@/shared/ui/ProfileCard";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useCurrentUser } from "@/shared/auth/hooks";
import { useMyUiProfile } from "@/shared/profile/hooks";
import { apis } from "@/shared/api";
import {
  isUiProfileEmpty,
} from "@/shared/profile/profileUi";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";
import { buildFullUrl } from "@/shared/utils";

function getProfileShareUrl(userId: number): string {
  return buildFullUrl(`profiles/${userId}`);
}

function getQrImageUrl(url: string, size: number): string {
  const data = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}`;
}

function RedirectToEditProfile(props: { to: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    const t = window.setTimeout(() => {
      navigate(props.to, { replace: true });
    }, 800);
    return () => window.clearTimeout(t);
  }, [navigate, props.to]);

  return (
    <Alert color="blue" title="プロフィールを作りましょう">
      <Stack gap="sm">
        <Text size="sm">
          あなたのプロフィールはまだ作成されていません。編集画面へ移動します。
        </Text>
        <Button
          onClick={() => navigate(props.to, { replace: true })}
          variant="light"
        >
          今すぐ作成する
        </Button>
      </Stack>
    </Alert>
  );
}

function MyProfileContent() {
  const navigate = useNavigate();
  const me = useCurrentUser();
  const profile = useMyUiProfile();

  const myUserId = useMemo(() => {
    const v = (me as any)?.id;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }, [me]);

  const shareUrl = useMemo(
    () => (myUserId ? getProfileShareUrl(myUserId) : ""),
    [myUserId]
  );
  const qrSize = 220;
  const qrImageUrl = useMemo(
    () => (shareUrl ? getQrImageUrl(shareUrl, qrSize) : ""),
    [shareUrl]
  );

  const [showQr, setShowQr] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const copyShareUrl = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("共有URLをコピーしました");
    } catch {
      setShareMessage("コピーに失敗しました");
    }
  }, [shareUrl]);

  const doShare = useCallback(async () => {
    if (!shareUrl) return;
    if (!navigator.share) {
      setShareMessage("Web共有APIに対応していないブラウザです");
      return;
    }
    try {
      await navigator.share({
        title: "私のプロフィール",
        text: "私のプロフィールを共有します。",
        url: shareUrl,
      });
      setShareMessage("プロフィールを共有しました");
    } catch {
      setShareMessage("プロフィールの共有に失敗しました");
    }
  }, [shareUrl]);

  if (isUiProfileEmpty(profile)) {
    return (
      <Stack gap="md">
        <Alert color="blue" title="プロフィールが未作成です">
          <Text size="sm">
            クイズやプロフィール共有をする前に、まずプロフィールを作成してください。
          </Text>
        </Alert>
        <Button
          onClick={() => navigate("/me/profile/edit")}
          fullWidth
          size="md"
        >
          プロフィールを作成する
        </Button>
        {myUserId && (
          <Alert color="gray" title="メモ">
            <Text size="sm">
              プロフィール作成後、この画面から「自分のQR」や「共有URL」を表示できます。
            </Text>
          </Alert>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <ProfileCard
        profile={profile}
        title={profile.displayName || "あなたのプロフィール"}
        subtitle={myUserId ? `userId: ${myUserId}` : "userId: (不明)"}
        actions={
          <ProfileCardActions
            onEdit={() => navigate("/me/profile/edit")}
            onShare={() => setShowQr(true)}
            editLabel="編集する"
            shareLabel="共有する"
            disabled={!shareUrl}
          />
        }
      />
      <Modal
        opened={showQr}
        onClose={() => setShowQr(false)}
        title={<Text fw={700}>プロフィール交換QR</Text>}
        centered
        size="auto"
      >
        <Stack align="stretch" gap="xs">
          {shareMessage && (
            <Alert
              color={shareMessage.includes("失敗") ? "red" : "green"}
              title="共有"
            >
              <Text size="sm">{shareMessage}</Text>
            </Alert>
          )}
          <Text size="sm" c="dimmed">
            このQRを相手に読み取ってもらうと、プロフィール詳細ページが開きます。
          </Text>
          <Group justify="center" mt="sm" mb="sm">
            <Image
              src={qrImageUrl}
              alt="プロフィール交換QR"
              w={qrSize}
              h={qrSize}
              fit="contain"
              fallbackSrc={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${qrSize}' height='${qrSize}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' dy='.3em'%3EQR生成中...%3C/text%3E%3C/svg%3E`}
            />
          </Group>
          <Text
            size="xs"
            c="dimmed"
            style={{ wordBreak: "break-all", textAlign: "center" }}
          >
            {shareUrl}
          </Text>
          <Group grow>
            <Button onClick={copyShareUrl} variant="default">
              URLをコピー
            </Button>
            <Button
              component={Link}
              to={`/profiles/${myUserId}`}
              variant="light"
            >
              公開プロフィールを開く
            </Button>
          </Group>
          <Group grow>
            <Button variant="outline" onClick={doShare}>
              共有する
            </Button>
            <Button onClick={() => setShowQr(false)} variant="subtle">
              閉じる
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export function MyProfileScreen() {
  return (
    <Container title="自分のプロフィール">
      <ErrorBoundary
        fallback={(error, retry) => {
          const is404 =
            error instanceof ResponseError && error.response.status === 404;
          if (is404) {
            return <RedirectToEditProfile to="/me/profile/edit" />;
          }
          return (
            <Alert color="red" title="プロフィールの取得に失敗しました">
              <Stack gap="sm">
                <Text size="sm">{error.message}</Text>
                <Group grow>
                  <Button variant="light" onClick={retry}>
                    再試行
                  </Button>
                  <Button component={Link} to="/me" variant="default">
                    戻る
                  </Button>
                </Group>
              </Stack>
            </Alert>
          );
        }}
      >
        <Suspense
          fallback={
            <Text size="sm" c="dimmed">
              読み込み中...
            </Text>
          }
        >
          <MyProfileContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
