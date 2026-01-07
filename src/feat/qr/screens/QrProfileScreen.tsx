import { Container } from "@/shared/ui/Container";
import { LegacyPlaceholderBanner } from "@/shared/ui/LegacyPlaceholderBanner";

export function QrProfileScreen() {
  return (
    <Container title="プロフィール共有QR">
      <LegacyPlaceholderBanner legacyPath="/make_qr" />
    </Container>
  );
}
