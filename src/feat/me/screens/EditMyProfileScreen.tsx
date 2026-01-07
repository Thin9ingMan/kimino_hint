import { Container } from "@/shared/ui/Container";
import { LegacyPlaceholderBanner } from "@/shared/ui/LegacyPlaceholderBanner";

export function EditMyProfileScreen() {
  return (
    <Container title="プロフィール編集">
      <LegacyPlaceholderBanner legacyPath="/edit_profile" />
    </Container>
  );
}
