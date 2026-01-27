import { Suspense } from "react";
import { useLoaderData } from "react-router-dom";
import { Text } from "@mantine/core";
import { apis } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import { ProfileDetailContent } from "../components/ProfileDetailContent";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";

/**
 * Type guard for ResponseError to avoid 'as'
 */
function isResponseError(error: unknown): error is ResponseError {
  return error instanceof ResponseError;
}

export async function loader({ params }: { params: { userId?: string } }) {
  const userId = Number(params.userId);
  if (Number.isNaN(userId)) {
    throw new Error("userId が不正です");
  }

  try {
    const [profileData, isFriendshipExchanged] = await Promise.all([
      apis.profiles.getUserProfile({ userId }),
      (async () => {
        try {
          await apis.friendships.getFriendshipByOtherUser({
            otherUserId: userId,
          });
          return true;
        } catch (e: unknown) {
          if (isResponseError(e) && e.response.status === 404) {
            return false;
          }
          throw e;
        }
      })(),
    ]);

    return {
      userId,
      profileData,
      isFriendshipExchanged,
      error: null,
    };
  } catch (e: unknown) {
    if (isResponseError(e) && e.response.status === 404) {
      return {
        userId,
        profileData: null,
        isFriendshipExchanged: false,
        error: "not_found" as const,
      };
    }
    throw e;
  }
}

export function ProfileDetailScreen() {
  const data = useLoaderData<typeof loader>();

  return (
    <Container title="プロフィール詳細">
      <Suspense
        fallback={
          <Text size="sm" c="dimmed">
            読み込み中...
          </Text>
        }
      >
        <ProfileDetailContent loaderData={data} />
      </Suspense>
    </Container>
  );
}

ProfileDetailScreen.loader = loader;

