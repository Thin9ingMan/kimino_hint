import { Container } from "@/shared/ui/Container";
import { LegacyPlaceholderBanner } from "@/shared/ui/LegacyPlaceholderBanner";

export function JoinEventScreen() {
  return (
    <Container title="ルームIDを入力してください">
      <LegacyPlaceholderBanner legacyPath="/room" />
    </Container>
  );
}
