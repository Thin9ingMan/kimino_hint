import { Alert, Button, Group, Image, Modal, Stack, Text } from "@mantine/core";
import { Link, useNavigate, useLoaderData } from "react-router-dom";
import { Suspense, useCallback, useMemo, useState } from "react";

import { Container } from "@/shared/ui/Container";
import { ProfileCard, ProfileCardActions } from "@/shared/ui/ProfileCard";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { apis, fetchCurrentUser } from "@/shared/api";
import {
  isUiProfileEmpty,
  mapProfileDataToUiProfile,
} from "@/shared/profile/profileUi";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";

function normalizeBaseUrlPath(): string {
  const basePath = String(import.meta.env.BASE_URL || "/");
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

function getProfileShareUrl(userId: number): string {
  const base = normalizeBaseUrlPath();
  return `${window.location.origin}${base}profiles/${userId}`;
}

function getQrImageUrl(url: string, size: number): string {
  const data = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}`;
}

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function loader() {
  const me = await fetchCurrentUser();
  let profileData: Record<string, unknown> | null = null;

  try {
    const res = await apis.profiles.getMyProfile();
    const rawPd = res.profileData;
    if (isRecord(rawPd)) {
      profileData = rawPd;
    }
  } catch (error) {
    if (error instanceof ResponseError && error.response.status === 404) {
      profileData = null;
    } else {
      throw error;
    }
  }

  return { me, profileData };
}

function MyProfileContent() {
  const navigate = useNavigate();
  const { me, profileData } = useLoaderData<typeof loader>();

  const profile = useMemo(
    () => mapProfileDataToUiProfile(profileData),
    [profileData],
  );

  const myUserId = me.id;

  const shareUrl = useMemo(
    () => (myUserId ? getProfileShareUrl(myUserId) : ""),
    [myUserId],
  );
  const qrSize = 220;
  const qrImageUrl = useMemo(
    () => (shareUrl ? getQrImageUrl(shareUrl, qrSize) : ""),
    [shareUrl],
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
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <ProfileCard
        profile={profile}
        title={profile.displayName || "あなたのプロフィール"}
        subtitle={`userId: ${myUserId}`}
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

MyProfileScreen.loader = loader;
