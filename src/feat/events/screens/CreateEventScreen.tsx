import { Container } from "@/shared/ui/Container";
import { LegacyPlaceholderBanner } from "@/shared/ui/LegacyPlaceholderBanner";

export function CreateEventScreen() {
  return (
    <Container title="イベント作成">
      <LegacyPlaceholderBanner legacyPath="/make_question" />
    </Container>
  );
}
