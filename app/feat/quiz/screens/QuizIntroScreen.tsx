import {
  Alert,
  Button,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Suspense, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import { generateQuizFromProfile } from "../utils/quizGenerator";
import type { Quiz, QuizQuestion } from "../types";

function QuizEditorContent() {
  const eventId = useNumericParam("eventId");
  const navigate = useNavigate();

  if (!eventId) {
    throw new Error("eventId が不正です");
  }

  // Fetch current user's profile and event user data
  const meData = useSuspenseQuery(
    ["quiz", "edit", "me", eventId],
    async () => {
      const me = await apis.auth.getCurrentUser();
      return me;
    }
  );

  const myProfile = useSuspenseQuery(
    ["quiz", "edit", "profile", eventId],
    async () => {
      const profile = await apis.profiles.getMyProfile();
      return profile;
    }
  );

  const eventUserData = useSuspenseQuery(
    ["quiz", "edit", "userdata", eventId, meData.id],
    async () => {
      // Try to fetch existing quiz data
      try {
        const userData = await apis.events.getEventUserData({
          eventId,
          userId: meData.id,
        });
        return userData;
      } catch {
        // User data doesn't exist yet - that's okay
        return null;
      }
    }
  );

  const existingQuiz = eventUserData?.userData?.myQuiz as Quiz | undefined;

  // Initialize quiz - either from existing data or generate from profile
  const [quiz, setQuiz] = useState<Quiz>(() => {
    if (existingQuiz?.questions?.length) {
      return existingQuiz;
    }
    return generateQuizFromProfile(myProfile);
  });

  const [saving, setSaving] = useState(false);

  // Update a specific question
  const updateQuestion = useCallback(
    (index: number, field: keyof QuizQuestion, value: string) => {
      setQuiz((prev) => {
        const newQuestions = [...prev.questions];
        if (field === "question") {
          newQuestions[index] = { ...newQuestions[index], question: value };
        } else if (field === "choices") {
          // This shouldn't happen in this UI, but handle it for safety
          return prev;
        }
        return { ...prev, questions: newQuestions };
      });
    },
    []
  );

  // Update a specific choice
  const updateChoice = useCallback(
    (questionIndex: number, choiceIndex: number, value: string) => {
      setQuiz((prev) => {
        const newQuestions = [...prev.questions];
        const newChoices = [...newQuestions[questionIndex].choices] as [
          string,
          string,
          string,
          string
        ];
        newChoices[choiceIndex] = value;
        newQuestions[questionIndex] = {
          ...newQuestions[questionIndex],
          choices: newChoices,
        };
        return { ...prev, questions: newQuestions };
      });
    },
    []
  );

  // Save quiz
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apis.events.updateEventUserData({
        eventId,
        userId: meData.id,
        eventUserDataUpdateRequest: {
          userData: {
            myQuiz: {
              ...quiz,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      });

      // Navigate back to lobby
      navigate(`/events/${eventId}`);
    } catch (err) {
      console.error("Failed to save quiz:", err);
      alert("クイズの保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [eventId, meData.id, quiz, navigate]);

  if (!quiz.questions.length) {
    return (
      <Stack gap="md">
        <Alert color="yellow" title="プロフィール情報不足">
          <Text size="sm">
            プロフィールに情報が不足しているため、クイズを生成できません。
            プロフィールを編集してから再度お試しください。
          </Text>
        </Alert>
        <Button component={Link} to="/me/profile/edit" fullWidth>
          プロフィールを編集
        </Button>
        <Button component={Link} to={`/events/${eventId}`} variant="default" fullWidth>
          ロビーへ戻る
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Alert color="blue" title="クイズ編集">
        <Text size="sm">
          自動生成されたクイズを確認・編集してください。
          他の参加者があなたのクイズに挑戦します。
        </Text>
      </Alert>

      {quiz.questions.map((question, qIdx) => (
        <Paper key={qIdx} withBorder p="md" radius="md">
          <Stack gap="sm">
            <Title order={5}>質問 {qIdx + 1}</Title>

            <TextInput
              label="問題文"
              value={question.question}
              onChange={(e) =>
                updateQuestion(qIdx, "question", e.currentTarget.value)
              }
              placeholder="問題文を入力"
            />

            <Text size="sm" fw={500} mt="xs">
              選択肢
            </Text>

            {question.choices.map((choice, cIdx) => (
              <TextInput
                key={cIdx}
                label={`選択肢 ${cIdx + 1}${cIdx === question.correctIndex ? " (正解)" : ""}`}
                value={choice}
                onChange={(e) =>
                  updateChoice(qIdx, cIdx, e.currentTarget.value)
                }
                placeholder={`選択肢 ${cIdx + 1}`}
                styles={{
                  label: {
                    color:
                      cIdx === question.correctIndex
                        ? "var(--mantine-color-green-6)"
                        : undefined,
                    fontWeight:
                      cIdx === question.correctIndex ? 600 : undefined,
                  },
                }}
              />
            ))}
          </Stack>
        </Paper>
      ))}

      <Stack gap="sm">
        <Button onClick={handleSave} loading={saving} fullWidth size="md">
          保存してロビーへ戻る
        </Button>
        <Button
          component={Link}
          to={`/events/${eventId}`}
          variant="default"
          fullWidth
        >
          キャンセル
        </Button>
      </Stack>
    </Stack>
  );
}

export function QuizIntroScreen() {
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
        <Suspense
          fallback={<Text size="sm" c="dimmed">読み込み中...</Text>}
        >
          <QuizEditorContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
