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
} from "@mantine/core";
import { IconRotate, IconCheck, IconDice5 } from "@tabler/icons-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Container } from "@/shared/ui/Container";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useNumericParam } from "@/shared/hooks/useNumericParam";
import {
  useSuspenseQueries,
} from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import { Loading } from "@/shared/ui/Loading";
import {
  handleQuizError,
  getErrorMessage,
  LLMGenerationError,
  QuizSaveError,
} from "../utils/errors";
import { generateQuizFromProfileAndFakes } from "../utils/quizFromFakes";
import { falseHobbies, falseArtists } from "../utils/fakeData";

interface FakeAnswers {
  username: string[];
  hobby: string[];
  artist: string[];
  verySimilarUsername?: string[];
}

interface ChoiceInputProps {
  value: string;
  onChange?: (val: string) => void;
  isCorrect?: boolean;
  onReroll?: () => void;
  loading?: boolean;
  placeholder?: string;
}

function ChoiceInput({
  value,
  onChange,
  isCorrect = false,
  onReroll,
  loading = false,
  placeholder,
}: ChoiceInputProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      <TextInput
        flex={1}
        value={value}
        onChange={(e) => onChange?.(e.currentTarget.value)}
        readOnly={isCorrect}
        placeholder={placeholder}
        leftSection={
          isCorrect ? (
            <IconCheck size={16} color="var(--mantine-color-teal-6)" />
          ) : null
        }
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
      {!isCorrect && onReroll && (
        <Tooltip label="別の選択肢を生成">
          <ActionIcon
            variant="light"
            size={48}
            radius="md"
            onClick={onReroll}
            disabled={loading}
          >
            {loading ? (
              <Loader size="xs" color="gray" />
            ) : (
              <IconDice5 size={20} stroke={1.5} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

function QuizEditContent() {
  const eventId = useNumericParam("eventId");
  const navigate = useNavigate();

  if (!eventId) {
    throw new Error("eventId が不正です");
  }

  const [meData, myProfile] = useSuspenseQueries([
    [["auth.getCurrentUser"], () => apis.auth.getCurrentUser()],
    [["profiles.getMyProfile"], () => apis.profiles.getMyProfile()],
  ]);

  const profileData = myProfile.profileData || {};
  const displayName = (profileData.displayName as string) || "";
  const hobby = (profileData.hobby as string) || "";
  const favoriteArtist = (profileData.favoriteArtist as string) || "";

  // State for fake choices
  const [fakes, setFakes] = useState({
    names: ["", "", ""],
    verySimilarNames: ["", "", ""],
    hobbies: ["", "", ""],
    artists: ["", "", ""],
  });

  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFake = (category: keyof typeof fakes, index: number, value: string) => {
    setFakes((prev) => {
      const next = { ...prev };
      const arr = [...next[category]];
      arr[index] = value;
      next[category] = arr as string[];
      return next;
    });
  };

  // Helper: Get random from source
  const getRandomSingle = (source: string[], exclude: string[]) => {
    const filtered = source.filter((item) => !exclude.includes(item));
    if (filtered.length === 0) return "";
    return filtered[Math.floor(Math.random() * filtered.length)];
  };

  // Reroll Handlers
  const rerollHobby = (index: number) => {
    const currentOnes = [hobby, ...fakes.hobbies];
    const newValue = getRandomSingle(falseHobbies, currentOnes);
    updateFake("hobbies", index, newValue);
  };

  const rerollArtist = (index: number) => {
    const currentOnes = [favoriteArtist, ...fakes.artists];
    const newValue = getRandomSingle(falseArtists, currentOnes);
    updateFake("artists", index, newValue);
  };

  const rerollName = async (index: number, isSimilar: boolean) => {
    const category = isSimilar ? "verySimilarNames" : "names";
    const key = `${category}-${index}`;
    
    setLoadingMap((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await apis.llm.generateFakeNames({
        fakeNamesRequest: {
          inputName: displayName,
          variance: isSimilar ? "ほぼ違いがない名前" : "互いにまったく似ていない名前",
        },
      });
      const output = Array.from(response.output || []);
      if (output.length > 0) {
        updateFake(category, index, output[0]);
      }
    } catch (err) {
      console.error("Failed to reroll name:", err);
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
      
      const newHobbies = [
        getRandomSingle(falseHobbies, [hobby]),
        getRandomSingle(falseHobbies, [hobby]),
        getRandomSingle(falseHobbies, [hobby]),
      ];
      const newArtists = [
        getRandomSingle(falseArtists, [favoriteArtist]),
        getRandomSingle(falseArtists, [favoriteArtist]),
        getRandomSingle(falseArtists, [favoriteArtist]),
      ];

      setFakes({
        names: [...diffs, "", "", ""].slice(0, 3),
        verySimilarNames: [...sims, "", "", ""].slice(0, 3),
        hobbies: newHobbies as string[],
        artists: newArtists as string[],
      });
    } catch (err) {
      setError("一括生成に失敗しました");
    } finally {
      setLoadingMap({ all: false });
    }
  };


  const handleSave = async () => {
    if (fakes.names.some(n => !n.trim())) {
      setError("名前の間違い選択肢をすべて入力してください");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const fakeAnswers: FakeAnswers = {
        username: fakes.names.filter(n => n.trim()),
        hobby: fakes.hobbies.filter(h => h.trim()),
        artist: fakes.artists.filter(a => a.trim()),
        verySimilarUsername: fakes.verySimilarNames.filter(n => n.trim()),
      };

      const myQuiz = generateQuizFromProfileAndFakes(myProfile, fakeAnswers);

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
        <Alert color="yellow" title="プロフィール情報不足">
          プロフィールに情報が不足しているため、クイズを作成できません。
        </Alert>
        <Button onClick={() => navigate("/me/profile/edit")} fullWidth>プロフィールを編集</Button>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" mb={100}>
      {error && (
        <Alert color="red" variant="filled" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      <Box>
        <Group justify="space-between" align="center" mb="md">
          <Box>
            <Title order={3}>クイズの選択肢を編集</Title>
            <Text size="sm" c="dimmed">
              他の参加者が答える4択クイズの間違いを作ります
            </Text>
          </Box>
          <Button
            variant="light"
            leftSection={<IconRotate size={16} />}
            onClick={fillAll}
            loading={loadingMap.all}
            size="sm"
          >
            一括自動生成
          </Button>
        </Group>
      </Box>

      {/* Name Section */}
      <Stack gap="xs">
        <Title order={5}>Q. 私の「名前」はどれ？</Title>
        <Stack gap="sm">
          <ChoiceInput value={displayName} isCorrect />
          {fakes.names.map((val, i) => (
            <ChoiceInput
              key={i}
              value={val}
              placeholder="間違いの選択肢を入力..."
              onChange={(v) => updateFake("names", i, v)}
              onReroll={() => rerollName(i, false)}
              loading={loadingMap[`names-${i}`]}
            />
          ))}
        </Stack>
      </Stack>

      {/* Similar Name Section */}
      <Stack gap="xs">
        <Title order={5}>Q. 改めて、私の「名前」はどれ？</Title>
        <Stack gap="sm">
          <ChoiceInput value={displayName} isCorrect />
          {fakes.verySimilarNames.map((val, i) => (
            <ChoiceInput
              key={i}
              value={val}
              placeholder="似ている間違いの名前を入力..."
              onChange={(v) => updateFake("verySimilarNames", i, v)}
              onReroll={() => rerollName(i, true)}
              loading={loadingMap[`verySimilarNames-${i}`]}
            />
          ))}
        </Stack>
      </Stack>

      {/* Hobby Section */}
      {hobby && (
        <Stack gap="xs">
          <Title order={5}>Q. 私の「趣味」はどれ？</Title>
          <Stack gap="sm">
            <ChoiceInput value={hobby} isCorrect />
            {fakes.hobbies.map((val, i) => (
              <ChoiceInput
                key={i}
                value={val}
                placeholder="間違いの趣味を入力..."
                onChange={(v) => updateFake("hobbies", i, v)}
                onReroll={() => rerollHobby(i)}
              />
            ))}
          </Stack>
        </Stack>
      )}

      {/* Artist Section */}
      {favoriteArtist && (
        <Stack gap="xs">
          <Title order={5}>Q. 私の「好きなアーティスト」はどれ？</Title>
          <Stack gap="sm">
            <ChoiceInput value={favoriteArtist} isCorrect />
            {fakes.artists.map((val, i) => (
              <ChoiceInput
                key={i}
                value={val}
                placeholder="間違いのアーティストを入力..."
                onChange={(v) => updateFake("artists", i, v)}
                onReroll={() => rerollArtist(i)}
              />
            ))}
          </Stack>
        </Stack>
      )}

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
