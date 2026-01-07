import { Container } from "@/shared/ui/Container";
import { LegacyPlaceholderBanner } from "@/shared/ui/LegacyPlaceholderBanner";

export function QrScanScreen() {
  return (
    <Container title="ルームに参加">
      <LegacyPlaceholderBanner legacyPath="/read_qr" />
    </Container>
  );
}
