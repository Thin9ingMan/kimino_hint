import { Container } from "@/shared/ui/Container";
import { LegacyPlaceholderBanner } from "@/shared/ui/LegacyPlaceholderBanner";

export function ReceivedFriendshipsScreen() {
  return (
    <Container title="受け取ったプロフィールカード">
      <LegacyPlaceholderBanner legacyPath="/profile_history" />
    </Container>
  );
}
