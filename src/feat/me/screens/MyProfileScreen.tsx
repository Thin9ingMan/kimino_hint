import { Container } from "@/shared/ui/Container";
import { LegacyPlaceholderBanner } from "@/shared/ui/LegacyPlaceholderBanner";

export function MyProfileScreen() {
  return (
    <Container title="プロフィール">
      <LegacyPlaceholderBanner legacyPath="/my_profile (and /profile)" />
    </Container>
  );
}
