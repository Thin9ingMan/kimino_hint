import React from 'react';
import { Card, Divider, Group, Stack, Text } from '@mantine/core';

// ProfileCard は外部から `profile` オブジェクトを受け取ります。
// 期待される shape: { name, faculty, hobby, favoriteArtist }
// profile prop が渡されない場合はフォールバック値を表示します。
export function ProfileCard({ profile: p = {} }) {
  // 安全なデストラクチャリングとデフォルト値
  const {
    name = '—',
    furigana = '-',
    grade = '-',
    faculty = '—',
    hobby = '—',
    favoriteArtist = '—',
  } = p || {};

  const rows = [
    { label: '名前', value: `${name}(${furigana || 'フリガナ'})` },
    { label: '学年', value: grade },
    { label: '学部', value: faculty },
    { label: '趣味', value: hobby },
    { label: '好きなアーティスト', value: favoriteArtist },
  ];

  return (
    <Card
      withBorder
      radius="lg"
      padding="md"
      styles={{
        root: {
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(6px)',
        },
      }}
    >
      <Stack gap="xs">
        {rows.map((r, idx) => (
          <React.Fragment key={r.label}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Text fw={700} c="#065f46" style={{ minWidth: 120 }}>
                {r.label}
              </Text>
              <Text style={{ flex: 1 }}>
                {r.value}
              </Text>
            </Group>
            {idx !== rows.length - 1 ? <Divider /> : null}
          </React.Fragment>
        ))}
      </Stack>
    </Card>
  );
}
