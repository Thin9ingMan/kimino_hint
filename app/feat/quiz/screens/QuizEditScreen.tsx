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
  ActionIcon,
  Tooltip,
  Loader,
  Card,
  Divider,
} from "@mantine/core";
import {
  IconRotate,
  IconCheck,
  IconDice5,
  IconPlus,
  IconTrash,
  IconExclamationCircle,
} from "@tabler/icons-react";
import { Suspense, useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import { useCurrentUser } from "@/shared/auth/hooks";
import { useMyProfile } from "@/shared/profile/hooks";
import { apis } from "@/shared/api";
import { Loading } from "@/shared/ui/Loading";
import {
  handleQuizError,
  getErrorMessage,
  LLMGenerationError,
  QuizSaveError,
} from "../utils/errors";
import { falseHobbies, falseArtists, faculty, grade } from "../utils/fakeData";

type QuestionCategory = "names" | "verySimilarNames" | "hobbies" | "artists" | "faculty" | "grade" | "custom";

interface ChoiceState {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionState {
  id: string;
  type: "fixed" | "custom";
  category: QuestionCategory;
  title: string;
  choices: ChoiceState[];
}

interface ChoiceInputProps {
  value: string;
  onChange?: (val: string) => void;
  isCorrect?: boolean;
  onReroll?: () => void;
  loading?: boolean;
  placeholder?: string;
  onSetCorrect?: () => void;
  readOnly?: boolean;
}

function ChoiceInput({
  value,
  onChange,
  isCorrect = false,
  onReroll,
  loading = false,
  placeholder,
  onSetCorrect,
  readOnly = false,
}: ChoiceInputProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      <ActionIcon
        variant={isCorrect ? "filled" : "light"}
        color={isCorrect ? "teal" : "gray"}
        onClick={onSetCorrect}
        size={40}
        radius="md"
        title={isCorrect ? "正解" : "正解に設定"}
      >
        <IconCheck size={18} />
      </ActionIcon>
      <TextInput
        flex={1}
        value={value}
        onChange={(e) => onChange?.(e.currentTarget.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        size="md"
        styles={(theme) => ({
          input: {
            backgroundColor: isCorrect
              ? "var(--mantine-color-teal-0)"
              : "transparent",
            borderColor: isCorrect
              ? "var(--mantine-color-teal-2)"
              : undefined,
            fontWeight: isCorrect ? 600 : 400,
            fontSize: theme.fontSizes.sm,
            height: 48,
          },
        })}
      />
      {onReroll && (
        <Tooltip label="別の選択肢を生成">
          <ActionIcon
            variant="light"
            size={40}
            radius="md"
            onClick={onReroll}
            disabled={loading}
          >
            {loading ? (
              <Loader size="xs" color="gray" />
            ) : (
              <IconDice5 size={18} stroke={1.5} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

interface QuestionEditorProps {
  question: QuestionState;
  onChange: (q: QuestionState) => void;
  onRemove?: () => void;
  onRerollChoice: (choiceId: string) => void;
  loadingMap: Record<string, boolean>;
}

function QuestionEditor({
  question,
  onChange,
  onRemove,
  onRerollChoice,
  loadingMap,
}: QuestionEditorProps) {
  const isFixed = question.type === "fixed";

  return (
    <Card withBorder radius="lg" p="lg" shadow="sm">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box flex={1}>
            <TextInput
              label="質問文"
              placeholder="例: 私の趣味は何でしょう？"
              value={question.title}
              onChange={(e) => onChange({ ...question, title: e.currentTarget.value })}
              readOnly={isFixed}
              size="md"
              styles={{ label: { marginBottom: 8, fontWeight: 700 } }}
            />
          </Box>
          {!isFixed && onRemove && (
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={onRemove}
              mt={32}
              title="質問を削除"
            >
              <IconTrash size={20} />
            </ActionIcon>
          )}
        </Group>

        <Divider variant="dashed" label="選択肢設定" labelPosition="center" />

        <Stack gap="xs">
          {question.choices.map((choice) => (
            <ChoiceInput
              key={choice.id}
              value={choice.text}
              isCorrect={choice.isCorrect}
              onChange={(val) => {
                const newChoices = question.choices.map(c => 
                  c.id === choice.id ? { ...c, text: val } : c
                );
                onChange({ ...question, choices: newChoices });
              }}
              onSetCorrect={() => {
                const newChoices = question.choices.map(c => ({
                  ...c,
                  isCorrect: c.id === choice.id
                }));
                onChange({ ...question, choices: newChoices });
              }}
              onReroll={isFixed && !choice.isCorrect ? () => onRerollChoice(choice.id) : undefined}
              loading={loadingMap[`${question.id}-${choice.id}`]}
              placeholder={choice.isCorrect ? "正解のテキスト..." : "間違いの選択肢..."}
              readOnly={isFixed && choice.isCorrect}
            />
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}

function QuizEditContent() {
  const eventId = useNumericParam("eventId");
  const navigate = useNavigate();

  if (!eventId) {
    throw new Error("eventId が不正です");
  }

  const meData = useCurrentUser();
  const myProfile = useMyProfile();
  const profileData = myProfile.profileData || {};

  const displayName = (profileData.displayName as string) || "";
  const hobby = (profileData.hobby as string) || "";
  const favoriteArtist = (profileData.favoriteArtist as string) || "";
  const myFaculty = (profileData.faculty as string) || "";
  const myGrade = (profileData.grade as string) || "";

  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInitialChoices = (correctText: string): [ChoiceState, ChoiceState, ChoiceState, ChoiceState] => {
    return [
      { id: crypto.randomUUID(), text: correctText, isCorrect: true },
      { id: crypto.randomUUID(), text: "", isCorrect: false },
      { id: crypto.randomUUID(), text: "", isCorrect: false },
      { id: crypto.randomUUID(), text: "", isCorrect: false },
    ];
  };

  // Initialize questions only once
  const isInitialized = useRef(false);
  useEffect(() => {
    if (isInitialized.current) return;
    if (!displayName && !hobby && !favoriteArtist && !myFaculty && !myGrade) return;

    const initialQuestions: QuestionState[] = [];

    // Question 1: Name
    if (displayName) {
      initialQuestions.push({
        id: "q-names",
        type: "fixed",
        category: "names",
        title: "私の「名前」はどれ？",
        choices: createInitialChoices(displayName),
      });
    }

    // Question 2: Faculty
    if (myFaculty) {
      initialQuestions.push({
        id: "q-faculty",
        type: "fixed",
        category: "faculty",
        title: "私の「学部」はどれ？",
        choices: createInitialChoices(myFaculty),
      });
    }

    // Question 3: Grade
    if (myGrade) {
      initialQuestions.push({
        id: "q-grade",
        type: "fixed",
        category: "grade",
        title: "私の「学年」はどれ？",
        choices: createInitialChoices(myGrade),
      });
    }

    // Question 4: Hobby
    if (hobby) {
      initialQuestions.push({
        id: "q-hobby",
        type: "fixed",
        category: "hobbies",
        title: "私の「趣味」はどれ？",
        choices: createInitialChoices(hobby),
      });
    }

    // Question 5: Name again (Very Similar Names)
    if (displayName) {
      initialQuestions.push({
        id: "q-vsim-names",
        type: "fixed",
        category: "verySimilarNames",
        title: "改めて、私の「名前」はどれ？",
        choices: createInitialChoices(displayName),
      });
    }

    // Question 6: Artist
    if (favoriteArtist) {
      initialQuestions.push({
        id: "q-artist",
        type: "fixed",
        category: "artists",
        title: "私の「好きなアーティスト」はどれ？",
        choices: createInitialChoices(favoriteArtist),
      });
    }

    setQuestions(initialQuestions);
    isInitialized.current = true;
  }, [displayName, hobby, favoriteArtist, myFaculty, myGrade]);

  const updateQuestion = (index: number, updated: QuestionState) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const addCustomQuestion = () => {
    const choices = [
      { id: crypto.randomUUID(), text: "", isCorrect: true },
      { id: crypto.randomUUID(), text: "", isCorrect: false },
      { id: crypto.randomUUID(), text: "", isCorrect: false },
      { id: crypto.randomUUID(), text: "", isCorrect: false },
    ];
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "custom",
        category: "custom",
        title: "",
        choices,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const getRandomSingle = (source: string[], exclude: string[]) => {
    const filtered = source.filter((item) => !exclude.includes(item));
    if (filtered.length === 0) return "";
    return filtered[Math.floor(Math.random() * filtered.length)];
  };

  const rerollChoice = async (qIndex: number, choiceId: string) => {
    const question = questions[qIndex];
    const key = `${question.id}-${choiceId}`;
    
    setLoadingMap((prev) => ({ ...prev, [key]: true }));
    try {
      let newValue = "";
      const currentChoiceTexts = question.choices.map(c => c.text);

      if (question.category === "names" || question.category === "verySimilarNames") {
        const isSimilar = question.category === "verySimilarNames";
        const response = await apis.llm.generateFakeNames({
          fakeNamesRequest: {
            inputName: displayName,
            variance: isSimilar ? "ほぼ違いがない名前" : "互いにまったく似ていない名前",
          },
        });
        const output = Array.from(response.output || []);
        if (output.length > 0) {
          newValue = output[0];
        }
      } else if (question.category === "hobbies") {
        newValue = getRandomSingle(falseHobbies, currentChoiceTexts);
      } else if (question.category === "artists") {
        newValue = getRandomSingle(falseArtists, currentChoiceTexts);
      } else if (question.category === "faculty") {
        newValue = getRandomSingle(faculty, currentChoiceTexts);
      } else if (question.category === "grade") {
        newValue = getRandomSingle(grade, currentChoiceTexts);
      }

      if (newValue) {
        const newChoices = question.choices.map(c => 
          c.id === choiceId ? { ...c, text: newValue } : c
        );
        updateQuestion(qIndex, { ...question, choices: newChoices });
      }
    } catch (err) {
      console.error("Failed to reroll choice:", err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const fillAll = async () => {
    setLoadingMap({ all: true });
    setError(null);
    try {
      const [differentNames, similarNames] = await Promise.all([
        apis.llm.generateFakeNames({
          fakeNamesRequest: { inputName: displayName, variance: "互いにまったく似ていない名前" },
        }),
        apis.llm.generateFakeNames({
          fakeNamesRequest: { inputName: displayName, variance: "ほぼ違いがない名前" },
        }),
      ]);

      const diffs = Array.from(differentNames.output || []).slice(0, 3);
      const sims = Array.from(similarNames.output || []).slice(0, 3);
      
      const newQuestions = questions.map((q) => {
        if (q.type !== "fixed") return q;

        const correctChoice = q.choices.find(c => c.isCorrect);
        const wrongChoices = q.choices.filter(c => !c.isCorrect);
        
        let newWrongTexts: string[] = [];

        if (q.category === "names") {
          newWrongTexts = diffs;
        } else if (q.category === "verySimilarNames") {
          newWrongTexts = sims;
        } else if (q.category === "hobbies") {
          newWrongTexts = [
            getRandomSingle(falseHobbies, [hobby]),
            getRandomSingle(falseHobbies, [hobby]),
            getRandomSingle(falseHobbies, [hobby])
          ];
        } else if (q.category === "artists") {
          newWrongTexts = [
            getRandomSingle(falseArtists, [favoriteArtist]),
            getRandomSingle(falseArtists, [favoriteArtist]),
            getRandomSingle(falseArtists, [favoriteArtist])
          ];
        } else if (q.category === "faculty") {
          newWrongTexts = [
            getRandomSingle(faculty, [myFaculty]),
            getRandomSingle(faculty, [myFaculty]),
            getRandomSingle(faculty, [myFaculty])
          ];
        } else if (q.category === "grade") {
          newWrongTexts = [
            getRandomSingle(grade, [myGrade]),
            getRandomSingle(grade, [myGrade]),
            getRandomSingle(grade, [myGrade])
          ];
        }

        const newChoices = [
          correctChoice!,
          ...wrongChoices.map((c, i) => ({ ...c, text: newWrongTexts[i] || "" }))
        ];

        return { ...q, choices: newChoices };
      });

      setQuestions(newQuestions);
    } catch (err) {
      console.error("FillAll failed:", err);
      setError("一括生成に失敗しました");
    } finally {
      setLoadingMap({ all: false });
    }
  };

  const handleSave = async () => {
    // Validation
    const invalidQuestion = questions.find(q => !q.title.trim() || q.choices.some(c => !c.text.trim()));
    if (invalidQuestion) {
      setError("すべての質問と選択肢を入力してください");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Legacy compatibility: fill fakeAnswers if possible
      const getWrongTexts = (category: QuestionCategory) => {
        const q = questions.find(qu => qu.category === category);
        if (!q) return [];
        return q.choices.filter(c => !c.isCorrect).map(c => c.text);
      };

      const fakeAnswers = {
        username: getWrongTexts("names"),
        verySimilarUsername: getWrongTexts("verySimilarNames"),
        hobby: getWrongTexts("hobbies"),
        artist: getWrongTexts("artists"),
      };

      // Construct direct correctness Quiz object
      const myQuiz = {
        questions: questions.map(q => ({
          id: q.id,
          question: q.title,
          choices: q.choices.map(c => ({ id: c.id, text: c.text, isCorrect: c.isCorrect })),
        })),
        updatedAt: new Date().toISOString(),
      };

      await apis.events.updateEventUserData({
        eventId,
        userId: meData.id,
        eventUserDataUpdateRequest: {
          userData: {
            myQuiz,
            fakeAnswers,
            updatedAt: new Date().toISOString(),
          },
        },
      });

      navigate(`/events/${eventId}`);
    } catch (err) {
      setError(getErrorMessage(new QuizSaveError(err as Error)));
    } finally {
      setSaving(false);
    }
  };

  if (!displayName && !hobby && !favoriteArtist) {
    return (
      <Stack gap="md">
        <Alert color="yellow" title="プロフィール情報不足" icon={<IconExclamationCircle />}>
          プロフィールに情報が不足しているため、クイズを作成できません。
        </Alert>
        <Button onClick={() => navigate("/me/profile/edit")} fullWidth>プロフィールを編集</Button>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" mb={150}>
      {error && (
        <Alert color="red" variant="filled" onClose={() => setError(null)} withCloseButton icon={<IconExclamationCircle />}>
          {error}
        </Alert>
      )}

      <Box>
        <Group justify="space-between" align="center" mb="md">
          <Box>
            <Title order={3}>クイズエディタ</Title>
            <Text size="sm" c="dimmed">
              自由に質問を追加して、あなただけのクイズを作りましょう
            </Text>
          </Box>
          <Button
            variant="light"
            leftSection={<IconRotate size={16} />}
            onClick={fillAll}
            loading={loadingMap.all}
            size="sm"
          >
            固定項目を自動埋め
          </Button>
        </Group>
      </Box>

      <Stack gap="lg">
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            onChange={(updated) => updateQuestion(i, updated)}
            onRemove={() => removeQuestion(i)}
            onRerollChoice={(choiceId) => rerollChoice(i, choiceId)}
            loadingMap={loadingMap}
          />
        ))}

        <Button
          variant="dashed"
          leftSection={<IconPlus size={20} />}
          onClick={addCustomQuestion}
          fullWidth
          size="lg"
          h={80}
          radius="lg"
          styles={{
            root: {
              borderWidth: 2,
              fontSize: 18,
            }
          }}
        >
          新しい質問を追加
        </Button>
      </Stack>

      <Paper
        p="md"
        shadow="xl"
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          maxWidth: 600,
          zIndex: 10,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
        radius="lg"
      >
        <Group grow gap="sm">
          <Button variant="default" onClick={() => navigate(`/events/${eventId}`)}>
            キャンセル
          </Button>
          <Button onClick={handleSave} loading={saving}>
            保存して完了
          </Button>
        </Group>
      </Paper>
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
              <Button variant="light" onClick={retry}>再試行</Button>
            </Stack>
          </Alert>
        )}
      >
        <Suspense fallback={<Loading />}>
          <QuizEditContent />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}
