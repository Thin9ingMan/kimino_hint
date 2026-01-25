import {
  Avatar,
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  ActionIcon,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { Link } from "react-router-dom";

interface Attendee {
  id: number;
  userId: number;
  displayName?: string;
  profileData?: Record<string, unknown> | null;
  joinedAt?: string | Date;
  status?: "active" | "inactive" | "left";
}

interface EventAttendeesListProps {
  attendees: Attendee[];
  title?: string;
  showStatus?: boolean;
  showJoinTime?: boolean;
  maxDisplay?: number;
  linkToProfile?: boolean;
  emptyMessage?: string;
  variant?: "list" | "grid" | "compact";
  onRefresh?: () => void;
}

function getDisplayName(attendee: Attendee): string {
  if (attendee.displayName) return attendee.displayName;

  const profileData = attendee.profileData;
  if (profileData?.displayName && typeof profileData.displayName === "string") {
    return profileData.displayName;
  }

  return `ユーザー ${attendee.userId}`;
}

function getStatusColor(status?: string) {
  switch (status) {
    case "active":
      return "green";
    case "inactive":
      return "yellow";
    case "left":
      return "gray";
    default:
      return "blue";
  }
}

function formatJoinTime(joinedAt?: string | Date): string {
  if (!joinedAt) return "";

  const date = typeof joinedAt === "string" ? new Date(joinedAt) : joinedAt;
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * イベント参加者一覧表示コンポーネント
 * EventLobbyScreen や EventLiveScreen で使用される参加者リスト表示を統一
 */
export function EventAttendeesList({
  attendees,
  title = "参加者",
  showStatus = true,
  showJoinTime = false,
  maxDisplay,
  linkToProfile = true,
  emptyMessage = "参加者がいません",
  variant = "list",
  onRefresh,
}: EventAttendeesListProps) {
  const displayAttendees = maxDisplay
    ? attendees.slice(0, maxDisplay)
    : attendees;

  const remainingCount =
    maxDisplay && attendees.length > maxDisplay
      ? attendees.length - maxDisplay
      : 0;

  if (attendees.length === 0) {
    return (
      <Stack gap="sm">
        {title && <Title order={4}>{title}</Title>}
        <Text size="sm" c="dimmed">
          {emptyMessage}
        </Text>
      </Stack>
    );
  }

  const renderAttendee = (attendee: Attendee, index: number) => {
    const displayName = getDisplayName(attendee);
    const joinTime = formatJoinTime(attendee.joinedAt);

    const content = (
      <Paper
        key={`attendee-${attendee.id}-${index}`}
        p="xs"
        withBorder={variant !== "compact"}
        style={{ cursor: linkToProfile ? "pointer" : "default" }}
      >
        <Group gap="sm" wrap="nowrap">
          <Avatar size="sm" color="blue">
            {displayName.charAt(0)}
          </Avatar>

          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" truncate>
              {displayName}
            </Text>
            {showJoinTime && joinTime && (
              <Text size="xs" c="dimmed">
                {joinTime}
              </Text>
            )}
          </Stack>

          {showStatus && attendee.status && (
            <Badge
              size="xs"
              color={getStatusColor(attendee.status)}
              variant="light"
            >
              {attendee.status}
            </Badge>
          )}
        </Group>
      </Paper>
    );

    if (linkToProfile) {
      return (
        <Link
          key={`attendee-link-${attendee.id}-${index}`}
          to={`/profiles/${attendee.userId}`}
          style={{ textDecoration: "none" }}
        >
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <Stack gap="sm">
      {title && (
        <Group justify="space-between">
          <Title order={4}>{title}</Title>
          {onRefresh ? (
            <ActionIcon
              variant="light"
              onClick={onRefresh}
              aria-label="参加者リストを更新"
            >
              <IconRefresh size={16} />
            </ActionIcon>
          ) : (
            <Badge variant="light" size="sm">
              {attendees.length}人
            </Badge>
          )}
        </Group>
      )}

      <Stack gap={variant === "compact" ? "xs" : "sm"}>
        {displayAttendees.map(renderAttendee)}

        {remainingCount > 0 && (
          <Text size="sm" c="dimmed" ta="center">
            他 {remainingCount}人
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
