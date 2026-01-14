import {
  Alert,
  Button,
  Stack,
  Text,
  TextInput,
  Title,
  Paper,
  Group,
  Box,
} from "@mantine/core";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import {
  handleQuizError,
  getErrorMessage,
  LLMGenerationError,
  QuizSaveError,
} from "../utils/errors";

interface FakeAnswers {
  username: string[];
  hobby: string[];
  artist: string[];
  verySimilarUsername?: string[];
}

function QuizEditContent() {
  const eventId = useNumericParam("eventId");
  const navigate = useNavigate();

  if (!eventId) {
    throw new Error("eventId が不正です");
  }

  const meData = useSuspenseQuery(["quiz", "edit", "me"], async () => {
    const me = await apis.auth.getCurrentUser();
    return me;
  });

  const myProfile = useSuspenseQuery(["quiz", "edit", "profile"], async () => {
    const profile = await apis.profiles.getMyProfile();
    return profile;
  });

  const profileData = myProfile.profileData || {};

  const [falseName1, setFalseName1] = useState("");
  const [falseName2, setFalseName2] = useState("");
  const [falseName3, setFalseName3] = useState("");

  const [falseHobby1, setFalseHobby1] = useState("");
  const [falseHobby2, setFalseHobby2] = useState("");
  const [falseHobby3, setFalseHobby3] = useState("");

  const [falseArtist1, setFalseArtist1] = useState("");
  const [falseArtist2, setFalseArtist2] = useState("");
  const [falseArtist3, setFalseArtist3] = useState("");

  const [verySimilarName1, setVerySimilarName1] = useState("");
  const [verySimilarName2, setVerySimilarName2] = useState("");
  const [verySimilarName3, setVerySimilarName3] = useState("");

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  const displayName = (profileData.displayName as string) || "";
  const hobby = (profileData.hobby as string) || "";
  const favoriteArtist = (profileData.favoriteArtist as string) || "";

  // Fetch fake names using LLM
  const fetchFakeNames = useCallback(async () => {
    if (!displayName) return;

    setGenerating(true);
    setHasAttemptedGeneration(true);
    try {
      const [differentNames, similarNames] = await Promise.all([
        apis.llm.generateFakeNames({
          fakeNamesRequest: {
            inputName: displayName,
            variance: "互いにまったく似ていない名前",
          },
        }),
        apis.llm.generateFakeNames({
          fakeNamesRequest: {
            inputName: displayName,
            variance: "ほぼ違いがない名前",
          },
        }),
      ]);

      const differentOutput = Array.from(differentNames.output || []);
      const similarOutput = Array.from(similarNames.output || []);

      if (differentOutput.length > 0) setFalseName1(differentOutput[0] || "");
      if (differentOutput.length > 1) setFalseName2(differentOutput[1] || "");
      if (differentOutput.length > 2) setFalseName3(differentOutput[2] || "");

      if (similarOutput.length > 0)
        setVerySimilarName1(similarOutput[0] || "");
      if (similarOutput.length > 1)
        setVerySimilarName2(similarOutput[1] || "");
      if (similarOutput.length > 2)
        setVerySimilarName3(similarOutput[2] || "");
    } catch (err) {
      console.error("Failed to generate fake names:", err);
      const quizError = new LLMGenerationError(err as Error);
      setError(getErrorMessage(quizError));
    } finally {
      setGenerating(false);
    }
  }, [displayName]);

  // Auto-generate on mount
  useEffect(() => {
    if (
      displayName &&
      !hasAttemptedGeneration &&
      !falseName1 &&
      !falseName2 &&
      !falseName3 &&
      !verySimilarName1 &&
      !verySimilarName2 &&
      !verySimilarName3
    ) {
      fetchFakeNames();
    }
  }, [
    displayName,
    hasAttemptedGeneration,
    falseName1,
    falseName2,
    falseName3,
    verySimilarName1,
    verySimilarName2,
    verySimilarName3,
    fetchFakeNames,
  ]);

  const handleSave = useCallback(async () => {
    // Validate that we have enough fake answers
    const nameCount = [falseName1, falseName2, falseName3].filter(n => n.trim()).length;
    const hobbyCount = [falseHobby1, falseHobby2, falseHobby3].filter(h => h.trim()).length;
    const artistCount = [falseArtist1, falseArtist2, falseArtist3].filter(a => a.trim()).length;
    
    if (nameCount < 3) {
      setError("名前の間違い選択肢を3つ入力してください");
      return;
    }
    
    if (hobby && hobbyCount < 3) {
      setError("趣味の間違い選択肢を3つ入力してください");
      return;
    }
    
    if (favoriteArtist && artistCount < 3) {
      setError("アーティストの間違い選択肢を3つ入力してください");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const fakeAnswers: FakeAnswers = {
        username: [falseName1, falseName2, falseName3].filter(n => n.trim()),
        hobby: [falseHobby1, falseHobby2, falseHobby3].filter(h => h.trim()),
        artist: [falseArtist1, falseArtist2, falseArtist3].filter(a => a.trim()),
        verySimilarUsername: [verySimilarName1, verySimilarName2, verySimilarName3].filter(n => n.trim()),
      };

      // Save fake answers to EventUserData
      await apis.events.updateEventUserData({
        eventId,
        userId: meData.id,
        eventUserDataUpdateRequest: {
          userData: {
            fakeAnswers,
            updatedAt: new Date().toISOString(),
          },
        },
      });

      // Navigate back to lobby
      navigate(`/events/${eventId}`);
    } catch (err) {
      console.error("Failed to save fake answers:", err);
      const quizError = new QuizSaveError(err as Error);
      setError(getErrorMessage(quizError));
    } finally {
      setSaving(false);
    }
  }, [
    eventId,
    meData.id,
    falseName1,
    falseName2,
    falseName3,
    falseHobby1,
    falseHobby2,
    falseHobby3,
    falseArtist1,
    falseArtist2,
    falseArtist3,
    verySimilarName1,
    verySimilarName2,
    verySimilarName3,
    hobby,
    favoriteArtist,
    navigate,
  ]);

  if (!displayName && !hobby && !favoriteArtist) {
    return (
      <Stack gap="md">
        <Alert color="yellow" title="プロフィール情報不足">
          <Text size="sm">
            プロフィールに情報が不足しているため、クイズを作成できません。
            プロフィールを編集してから再度お試しください。
          </Text>
        </Alert>
        <Button
          onClick={() => navigate("/me/profile/edit")}
          fullWidth
        >
          プロフィールを編集
        </Button>
        <Button
          onClick={() => navigate(`/events/${eventId}`)}
          variant="default"
          fullWidth
        >
          ロビーへ戻る
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {error && (
        <Alert color="red" title="エラー" onClose={() => setError(null)} withCloseButton>
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      <Alert color="blue" title="間違いの選択肢を作成">
        <Text size="sm">
          他の参加者が挑戦するクイズの間違いの選択肢を作成してください。
          「自動生成」ボタンでAIが選択肢を提案します。
        </Text>
      </Alert>

      {/* Name section */}
      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Title order={5}>名前</Title>
          <Box
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(12,74,110,0.08)",
            }}
          >
            <Text size="sm" fw={500}>
              正解: {displayName}
            </Text>
          </Box>
          <Text size="sm" c="dimmed">
            間違いの選択肢（似ていない名前）
          </Text>
          <TextInput
            label="選択肢 1"
            value={falseName1}
            onChange={(e) => setFalseName1(e.currentTarget.value)}
            placeholder="例: 田中 太郎"
            required
          />
          <TextInput
            label="選択肢 2"
            value={falseName2}
            onChange={(e) => setFalseName2(e.currentTarget.value)}
            placeholder="例: 鈴木 花子"
            required
          />
          <TextInput
            label="選択肢 3"
            value={falseName3}
            onChange={(e) => setFalseName3(e.currentTarget.value)}
            placeholder="例: 佐藤 健"
            required
          />
          <Text size="sm" c="dimmed" mt="xs">
            間違いの選択肢（とても似ている名前）
          </Text>
          <TextInput
            label="選択肢 1"
            value={verySimilarName1}
            onChange={(e) => setVerySimilarName1(e.currentTarget.value)}
            placeholder="例: 山田 花"
          />
          <TextInput
            label="選択肢 2"
            value={verySimilarName2}
            onChange={(e) => setVerySimilarName2(e.currentTarget.value)}
            placeholder="例: 山田 華"
          />
          <TextInput
            label="選択肢 3"
            value={verySimilarName3}
            onChange={(e) => setVerySimilarName3(e.currentTarget.value)}
            placeholder="例: 山本 花"
          />
        </Stack>
      </Paper>

      {/* Hobby section */}
      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Title order={5}>趣味</Title>
          <Box
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(12,74,110,0.08)",
            }}
          >
            <Text size="sm" fw={500}>
              正解: {hobby || "（未設定）"}
            </Text>
          </Box>
          <Text size="sm" c="dimmed">
            間違いの選択肢
          </Text>
          <TextInput
            label="選択肢 1"
            value={falseHobby1}
            onChange={(e) => setFalseHobby1(e.currentTarget.value)}
            placeholder="例: 読書"
          />
          <TextInput
            label="選択肢 2"
            value={falseHobby2}
            onChange={(e) => setFalseHobby2(e.currentTarget.value)}
            placeholder="例: サッカー"
          />
          <TextInput
            label="選択肢 3"
            value={falseHobby3}
            onChange={(e) => setFalseHobby3(e.currentTarget.value)}
            placeholder="例: 料理"
          />
        </Stack>
      </Paper>

      {/* Artist section */}
      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Title order={5}>好きなアーティスト</Title>
          <Box
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(12,74,110,0.08)",
            }}
          >
            <Text size="sm" fw={500}>
              正解: {favoriteArtist || "（未設定）"}
            </Text>
          </Box>
          <Text size="sm" c="dimmed">
            間違いの選択肢
          </Text>
          <TextInput
            label="選択肢 1"
            value={falseArtist1}
            onChange={(e) => setFalseArtist1(e.currentTarget.value)}
            placeholder="例: YOASOBI"
          />
          <TextInput
            label="選択肢 2"
            value={falseArtist2}
            onChange={(e) => setFalseArtist2(e.currentTarget.value)}
            placeholder="例: ヨルシカ"
          />
          <TextInput
            label="選択肢 3"
            value={falseArtist3}
            onChange={(e) => setFalseArtist3(e.currentTarget.value)}
            placeholder="例: 米津玄師"
          />
        </Stack>
      </Paper>

      <Group justify="center">
        <Button
          onClick={fetchFakeNames}
          loading={generating}
          variant="default"
        >
          名前を自動生成
        </Button>
      </Group>

      <Stack gap="sm">
        <Button onClick={handleSave} loading={saving} fullWidth size="md">
          保存してロビーへ戻る
        </Button>
        <Button
          onClick={() => navigate(`/events/${eventId}`)}
          variant="default"
          fullWidth
        >
          キャンセル
        </Button>
      </Stack>
    </Stack>
  );
}

export function QuizEditScreen() {
  return (
    <Container title="クイズ編集">
      <ErrorBoundary
        fallback={(error, retry) => (
          <Alert color="red" title="読み込みエラー">
            <Stack gap="sm">
              <Text size="sm">{error.message}</Text>
              <Button variant="light" onClick={retry}>
                再試行
              </Button>
            </Stack>
          </Alert>
        )}
      >
        <Suspense fallback={<Text size="sm" c="dimmed">読み込み中...</Text>}>
          <QuizEditContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
