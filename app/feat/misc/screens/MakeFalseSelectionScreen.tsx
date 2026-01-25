import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apis } from "@/shared/api";
import { Button, Group, Stack, TextInput, Text, Box } from "@mantine/core";
import * as options from "@/shared/profile/options";

function randomMakeSelection(arr: readonly string[], exclude?: string) {
  const filtered = arr.filter((x) => x && x !== exclude);
  const shuffled = [...filtered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

export default function MakeFalseSelectionScreen() {
  const navigate = useNavigate();
  const [falseName1, setFalseName1] = useState("");
  const [falseName2, setFalseName2] = useState("");
  const [falseName3, setFalseName3] = useState("");

  const [falseHobby1, setFalseHobby1] = useState("");
  const [falseHobby2, setFalseHobby2] = useState("");
  const [falseHobby3, setFalseHobby3] = useState("");

  const [falseArtist1, setFalseArtist1] = useState("");
  const [falseArtist2, setFalseArtist2] = useState("");
  const [falseArtist3, setFalseArtist3] = useState("");

  const [answers, setAnswers] = useState({
    name: "",
    hobby: "",
    favoriteArtist: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apis.profiles.getMyProfile();
      const pd = res?.profileData || {};
      setAnswers({
        name: pd.displayName || "",
        hobby: pd.hobby || "",
        favoriteArtist: pd.favoriteArtist || "",
      });
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setAnswers({ name: "", hobby: "", favoriteArtist: "" });
      } else {
        // non-fatal
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchFakeNames = useCallback(async (inputName: string) => {
    if (!inputName) return;
    try {
      const res = await apis.llm.generateFakeNames({
        fakeNamesRequest: { inputName, variance: "とても良く似ている名前" },
      });
      const received = Array.from(res.output || []);
      if (received.length > 0) setFalseName1(received[0] || "");
      if (received.length > 1) setFalseName2(received[1] || "");
      if (received.length > 2) setFalseName3(received[2] || "");
    } catch (err) {
      console.error("Failed to fetch fake names:", err);
    }
  }, []);

  useEffect(() => {
    if (answers.name) fetchFakeNames(answers.name);
  }, [answers.name, fetchFakeNames]);

  const randomize = useCallback(() => {
    // Note: we reference the global false arrays from legacy code location
    // Keep behaviour same as legacy
    // @ts-ignore
    const randomNames = randomMakeSelection(options.FALSE_NAMES, answers.name);
    // @ts-ignore
    const randomHobbies = randomMakeSelection(
      options.FALSE_HOBBIES,
      answers.hobby,
    );
    // @ts-ignore
    const randomArtists = randomMakeSelection(
      options.FALSE_ARTISTS,
      answers.favoriteArtist,
    );

    setFalseName1(randomNames[0] || "");
    setFalseName2(randomNames[1] || "");
    setFalseName3(randomNames[2] || "");

    setFalseHobby1(randomHobbies[0] || "");
    setFalseHobby2(randomHobbies[1] || "");
    setFalseHobby3(randomHobbies[2] || "");

    setFalseArtist1(randomArtists[0] || "");
    setFalseArtist2(randomArtists[1] || "");
    setFalseArtist3(randomArtists[2] || "");
  }, [answers]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const falseAnswers = {
        username: [falseName1, falseName2, falseName3],
        hobby: [falseHobby1, falseHobby2, falseHobby3],
        artist: [falseArtist1, falseArtist2, falseArtist3],
      };
      window.localStorage.setItem("falseAnswers", JSON.stringify(falseAnswers));
      navigate("/question", { state: { falseAnswers } });
    },
    [
      falseName1,
      falseName2,
      falseName3,
      falseHobby1,
      falseHobby2,
      falseHobby3,
      falseArtist1,
      falseArtist2,
      falseArtist3,
      navigate,
    ],
  );

  return (
    <Stack align="center" gap="md">
      <Box style={{ width: 320 }}>
        <Stack align="center">
          <Text style={{ textAlign: "center" }} fw={700}>
            名前
          </Text>
          <Box style={{ width: "100%", textAlign: "center" }}>
            <Box
              style={{
                display: "inline-block",
                width: 280,
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(12,74,110,0.08)",
              }}
            >
              <Text size="sm">{answers.name}</Text>
            </Box>
          </Box>

          <TextInput
            value={falseName1}
            onChange={(e) => setFalseName1(e.currentTarget.value)}
            placeholder="名前"
          />
          <TextInput
            value={falseName2}
            onChange={(e) => setFalseName2(e.currentTarget.value)}
          />
          <TextInput
            value={falseName3}
            onChange={(e) => setFalseName3(e.currentTarget.value)}
          />
        </Stack>
      </Box>

      <Box style={{ width: 320 }}>
        <Stack align="center">
          <Text style={{ textAlign: "center" }} fw={700}>
            趣味
          </Text>
          <Box style={{ width: "100%", textAlign: "center" }}>
            <Box
              style={{
                display: "inline-block",
                width: 280,
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(12,74,110,0.08)",
              }}
            >
              <Text size="sm">{answers.hobby}</Text>
            </Box>
          </Box>

          <TextInput
            value={falseHobby1}
            onChange={(e) => setFalseHobby1(e.currentTarget.value)}
            placeholder="趣味"
          />
          <TextInput
            value={falseHobby2}
            onChange={(e) => setFalseHobby2(e.currentTarget.value)}
          />
          <TextInput
            value={falseHobby3}
            onChange={(e) => setFalseHobby3(e.currentTarget.value)}
          />
        </Stack>
      </Box>

      <Box style={{ width: 320 }}>
        <Stack align="center">
          <Text style={{ textAlign: "center" }} fw={700}>
            好きなアーティスト
          </Text>
          <Box style={{ width: "100%", textAlign: "center" }}>
            <Box
              style={{
                display: "inline-block",
                width: 280,
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(12,74,110,0.08)",
              }}
            >
              <Text size="sm">{answers.favoriteArtist}</Text>
            </Box>
          </Box>

          <TextInput
            value={falseArtist1}
            onChange={(e) => setFalseArtist1(e.currentTarget.value)}
            placeholder="好きなアーティスト"
          />
          <TextInput
            value={falseArtist2}
            onChange={(e) => setFalseArtist2(e.currentTarget.value)}
          />
          <TextInput
            value={falseArtist3}
            onChange={(e) => setFalseArtist3(e.currentTarget.value)}
          />
        </Stack>
      </Box>

      <Group justify="center" style={{ width: "100%" }}>
        <Button variant="default" onClick={randomize}>
          ランダムで作成
        </Button>
      </Group>

      <Group justify="space-between" style={{ width: 320 }}>
        <Button component={Link} to="/room" variant="outline">
          戻る
        </Button>
        <Button onClick={handleSubmit}>次へ</Button>
      </Group>
    </Stack>
  );
}
