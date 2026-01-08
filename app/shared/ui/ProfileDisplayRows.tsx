import { Box, Group, Stack, Text } from "@mantine/core";
import { UiProfile } from "@/shared/profile/profileUi";

interface ProfileRow {
  label: string;
  value: string;
}

interface ProfileDisplayRowsProps {
  profile: UiProfile;
  variant?: "default" | "compact" | "detailed";
}

/**
 * プロフィール情報を行形式で表示する統一コンポーネント
 * MyProfileScreen や ProfileDetailScreen で使用される表示パターンを統一
 */
export function ProfileDisplayRows({
  profile,
  variant = "default",
}: ProfileDisplayRowsProps) {
  const allRows: ProfileRow[] = [
    { label: "名前", value: profile.displayName },
    { label: "フリガナ", value: profile.furigana },
    { label: "学部", value: profile.faculty },
    { label: "学年", value: profile.grade },
    { label: "趣味", value: profile.hobby },
    { label: "好きなアーティスト", value: profile.favoriteArtist },
  ];

  // 値が存在する行のみフィルター（showEmpty=true の場合は全て表示）
  const displayRows = allRows.filter((row) => row.value?.trim());

  const rowSpacing = variant === "compact" ? "xs" : "sm";
  const labelSize = variant === "detailed" ? "sm" : "xs";
  const valueSize = variant === "compact" ? "sm" : "md";

  return (
    <Stack gap={rowSpacing}>
      {displayRows.map((row, index) => (
        <Box key={`${row.label}-${index}`}>
          <Group justify="space-between" wrap="nowrap">
            <Text size={labelSize} c="dimmed" style={{ minWidth: "80px" }}>
              {row.label}:
            </Text>
            <Text
              size={valueSize}
              style={{
                textAlign: "right",
                wordBreak: "break-word",
                flex: 1,
              }}
            >
              {row.value || "未入力"}
            </Text>
          </Group>
        </Box>
      ))}
    </Stack>
  );
}
