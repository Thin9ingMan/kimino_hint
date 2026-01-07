import { Alert, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { apis } from '@/shared/api';
import { Container } from '@/shared/ui/Container';

type UiProfile = {
  displayName: string;
  furigana?: string;
  grade?: string;
  faculty?: string;
  hobby?: string;
  favoriteArtist?: string;
  tagline?: string;
};

function toUiProfile(profileData?: Record<string, unknown>): UiProfile {
  const pd = profileData ?? {};
  return {
    displayName: String((pd.displayName as string | undefined) ?? ''),
    furigana: (pd.furigana as string | undefined) ?? '',
    grade: (pd.grade as string | undefined) ?? '',
    faculty: (pd.faculty as string | undefined) ?? '',
    hobby: (pd.hobby as string | undefined) ?? '',
    favoriteArtist: (pd.favoriteArtist as string | undefined) ?? '',
    tagline: (pd.tagline as string | undefined) ?? '',
  };
}

export function ProfileDetailScreen() {
  const params = useParams();
  const userId = useMemo(() => {
    const raw = params.userId ?? '';
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params.userId]);

  const [profile, setProfile] = useState<UiProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [exchanging, setExchanging] = useState(false);
  const [exchangeDone, setExchangeDone] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setError('userId が不正です');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const res = await apis.profiles.getUserProfile({ userId });
      setProfile(toUiProfile(res?.profileData as unknown as Record<string, unknown>));
      setStatus('ready');
    } catch (e: any) {
      console.error('Failed to fetch user profile:', e);
      const s = e?.status ?? e?.response?.status;
      if (s === 404) setError('プロフィールが見つかりませんでした');
      else if (s === 401) setError('認証が必要です（トークンが無効か期限切れの可能性）');
      else setError('プロフィールの取得に失敗しました');
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleExchange = useCallback(async () => {
    if (!userId) return;

    setExchanging(true);
    setExchangeDone(false);
    setExchangeError(null);

    try {
      await apis.friendships.receiveFriendship({
        userId,
        receiveFriendshipRequest: {
          meta: {
            source: 'profile-detail',
            at: new Date().toISOString(),
          },
        },
      });
      setExchangeDone(true);
    } catch (e: any) {
      console.error('Failed to create friendship:', e);
      const s = e?.status ?? e?.response?.status;
      if (s === 409) setExchangeError('すでに交換済みです');
      else setExchangeError('交換に失敗しました');
    } finally {
      setExchanging(false);
    }
  }, [userId]);

  const title = profile?.displayName || (userId ? `User #${userId}` : 'プロフィール');

  return (
    <Container title="プロフィール" size={720}>
      <Stack gap="md">
        <Button component={Link} to="/profiles" variant="subtle" w="fit-content">
          ← 一覧へ
        </Button>

        {status === 'loading' && (
          <Group justify="center" gap="sm">
            <Loader size="sm" />
            <Text>読み込み中...</Text>
          </Group>
        )}

        {status === 'error' && (
          <Alert color="red" title="取得に失敗しました">
            <Stack gap="sm">
              <Text>{error}</Text>
              <Group>
                <Button onClick={fetchProfile}>再試行</Button>
              </Group>
            </Stack>
          </Alert>
        )}

        {status === 'ready' && profile && (
          <Card withBorder radius="lg" p="xl">
            <Stack gap={10}>
              <Title order={2}>{title}</Title>

              {(profile.furigana || profile.tagline) && (
                <Text c="dimmed">
                  {[profile.furigana, profile.tagline].filter(Boolean).join(' / ')}
                </Text>
              )}

              <Group gap="xs">
                {profile.faculty && (
                  <Text size="sm">
                    学部: <b>{profile.faculty}</b>
                  </Text>
                )}
                {profile.grade && (
                  <Text size="sm">
                    学年: <b>{profile.grade}</b>
                  </Text>
                )}
              </Group>

              <Group gap="xs">
                {profile.hobby && (
                  <Text size="sm">
                    趣味: <b>{profile.hobby}</b>
                  </Text>
                )}
                {profile.favoriteArtist && (
                  <Text size="sm">
                    好きなアーティスト: <b>{profile.favoriteArtist}</b>
                  </Text>
                )}
              </Group>

              <Stack gap="xs" mt="sm">
                <Button onClick={handleExchange} loading={exchanging}>
                  プロフィールカードを受け取る
                </Button>

                {exchangeDone && <Alert color="green">交換しました</Alert>}
                {exchangeError && <Alert color="red">{exchangeError}</Alert>}
              </Stack>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
