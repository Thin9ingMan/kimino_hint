import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Box,
  Textarea,
} from "@mantine/core";
import { ReactNode } from "react";
import { UiProfile } from "@/shared/profile/profileUi";
import { ProfileDisplayRows } from "./ProfileDisplayRows";

interface ProfileCardProps {
  profile: UiProfile;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

/**
 * プロフィール情報をカード形式で統一表示するコンポーネント
 * シンプルで実用的な設計。ローディング状態はSuspenseで処理
 */
export function ProfileCard({
  profile,
  title,
  subtitle,
  actions,
  variant = "default",
  className,
}: ProfileCardProps) {
  const cardPadding = variant === "compact" ? "sm" : "md";
  return (
    <Card withBorder p={cardPadding} className={className}>
      <Stack gap={variant === "compact" ? "sm" : "md"}>
        {(title || subtitle) && (
          <Stack gap="xs">
            {title && (
              <Title order={variant === "detailed" ? 2 : 3}>{title}</Title>
            )}
            {subtitle && (
              <Text size="sm" c="dimmed">
                {subtitle}
              </Text>
            )}
          </Stack>
        )}

        <ProfileDisplayRows profile={profile} variant={variant} />
        <Box mt="xs">
          <Text fw={700} size="sm" mb={5} style={{ color: "#065f46" }}>
            メモ
          </Text>
          <Textarea
            placeholder="自由に記入してください"
            defaultValue={""}
            autosize
            minRows={3}
            variant="filled"
            radius="md"
          />
        </Box>
        {actions && (
          <Group justify="flex-end" mt="sm">
            {actions}
          </Group>
        )}
      </Stack>
    </Card>
  );
}

/**
 * プロフィールカード用の標準アクションボタンセット
 */
export interface ProfileCardActionsProps {
  onEdit?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  shareLabel?: string;
  deleteLabel?: string;
  disabled?: boolean;
}

export function ProfileCardActions({
  onEdit,
  onShare,
  onDelete,
  editLabel = "編集",
  shareLabel = "共有",
  deleteLabel = "削除",
  disabled = false,
}: ProfileCardActionsProps) {
  return (
    <Group gap="sm">
      {onEdit && (
        <Button variant="light" size="sm" onClick={onEdit} disabled={disabled}>
          {editLabel}
        </Button>
      )}
      {onShare && (
        <Button
          variant="outline"
          size="sm"
          onClick={onShare}
          disabled={disabled}
        >
          {shareLabel}
        </Button>
      )}
      {onDelete && (
        <Button
          variant="subtle"
          color="red"
          size="sm"
          onClick={onDelete}
          disabled={disabled}
        >
          {deleteLabel}
        </Button>
      )}
    </Group>
  );
}
