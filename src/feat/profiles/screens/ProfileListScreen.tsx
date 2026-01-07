import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { apis } from '@/shared/api';
import { Container } from '@/shared/ui/Container';

type Friendship = {
  id: number;
  senderUserId: number;
  recipientUserId: number;
  senderProfile?: {
    userId: number;
    profileData?: Record<string, unknown>;
  };
  createdAt?: string;
};

type UiProfile = {
  displayName: string;
  furigana?: string;
  grade?: string;
  faculty?: string;
  hobby?: string;
  favoriteArtist?: string;
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
  };
}

export function ProfileListScreen() {
  const [items, setItems] = useState<Friendship[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const fetchFriendships = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await apis.friendships.listReceivedFriendships();
      setItems((res ?? []) as unknown as Friendship[]);
      setStatus('ready');
    } catch (e: any) {
      console.error('Failed to list received friendships:', e);
      setError(String(e?.message ?? 'プロフィール一覧の取得に失敗しました'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void fetchFriendships();
  }, [fetchFriendships]);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    return copy;
  }, [items]);

  return (
    <Container title="プロフィール一覧" size={720}>
      <Stack gap="md">
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
              <Button onClick={fetchFriendships}>再試行</Button>
            </Stack>
          </Alert>
        )}

        {status === 'ready' && sorted.length === 0 && (
          <Card>
            <Stack gap={6}>
              <Title order={3} size="h4">
                まだカードがありません
              </Title>
              <Text c="dimmed" size="sm">
                QR 交換などで受け取ったプロフィールカードがここに表示されます。
              </Text>
            </Stack>
          </Card>
        )}

        {status === 'ready' &&
          sorted.map((f) => {
            const senderId = f.senderUserId;
            const ui = toUiProfile(f.senderProfile?.profileData);
            const name = ui.displayName || `User #${senderId}`;

            return (
              <Card key={f.id} withBorder radius="lg" p="lg">
                <Stack gap={10}>
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Title order={3} size="h4">
                        {name}
                      </Title>
                      {(ui.furigana || ui.faculty || ui.grade) && (
                        <Text c="dimmed" size="sm">
                          {[ui.furigana, ui.faculty, ui.grade].filter(Boolean).join(' / ')}
                        </Text>
                      )}
                    </div>
                    <Button component={Link} to={`/profiles/${senderId}`} variant="light">
                      詳細
                    </Button>
                  </Group>

                  <Group gap="xs">
                    {ui.hobby && (
                      <Text size="sm">
                        趣味: <b>{ui.hobby}</b>
                      </Text>
                    )}
                    {ui.favoriteArtist && (
                      <Text size="sm">
                        好きなアーティスト: <b>{ui.favoriteArtist}</b>
                      </Text>
                    )}
                  </Group>
                </Stack>
              </Card>
            );
          })}
      </Stack>
    </Container>
  );
}
