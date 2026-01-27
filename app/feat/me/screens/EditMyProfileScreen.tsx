import {
  Alert,
  Button,
  Card,
  Divider,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLoaderData } from "react-router-dom";

import { apis, AppError } from "@/shared/api";
import { Container } from "@/shared/ui/Container";
import { FACULTY_OPTIONS, GRADE_OPTIONS } from "@/shared/profile/options";
import { ResponseError } from "@yuki-js/quarkus-crud-js-fetch-client";

type ProfileFormState = {
  name: string;
  furigana: string;
  grade: string;
  faculty: string;
  hobby: string;
  favoriteArtist: string;
  facultyDetail: string;
};

type FormField = {
  id: keyof ProfileFormState;
  label: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  type?: "text" | "select";
  options?: readonly string[];
};

const FORM_FIELDS: FormField[] = [
  {
    id: "name",
    label: "名前",
    placeholder: "名前",
    required: true,
    autoFocus: true,
  },
  { id: "furigana", label: "フリガナ", placeholder: "フリガナ" },
  { id: "faculty", label: "学部", type: "select", options: FACULTY_OPTIONS },
  { id: "facultyDetail", label: "学科名" },
  {
    id: "grade",
    label: "学年",
    type: "select",
    options: GRADE_OPTIONS,
    required: true,
  },
  { id: "hobby", label: "趣味", placeholder: "趣味", required: true },
  {
    id: "favoriteArtist",
    label: "好きなアーティスト",
    placeholder: "好きなアーティスト",
    required: true,
  },
];

const REQUIRED_FIELDS: Array<{ key: keyof ProfileFormState; label: string }> = [
  { key: "name", label: "名前" },
  { key: "faculty", label: "学部" },
  { key: "grade", label: "学年" },
  { key: "hobby", label: "趣味" },
  { key: "favoriteArtist", label: "好きなアーティスト" },
];

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Type guard for Record<string, unknown>
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function loader() {
  try {
    const res = await apis.profiles.getMyProfile();
    return { profile: res };
  } catch (error) {
    if (error instanceof ResponseError && error.response.status === 404) {
      return { profile: null };
    }
    throw new AppError("プロフィールの読み込みに失敗しました", {
      cause: error,
      recoveryUrl: "/me/profile",
    });
  }
}

function EditProfileForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { profile: initialData } = useLoaderData<typeof loader>();

  const initialProfile: ProfileFormState = useMemo(() => {
    const pd = isRecord(initialData?.profileData)
      ? initialData.profileData
      : {};
    return {
      name: getString(pd.displayName),
      furigana: getString(pd.furigana),
      grade: getString(pd.grade),
      faculty: getString(pd.faculty),
      hobby: getString(pd.hobby),
      favoriteArtist: getString(pd.favoriteArtist),
      facultyDetail: getString(pd.facultyDetail),
    };
  }, [initialData]);

  const [profile, setProfile] = useState<ProfileFormState>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const formFields = useMemo(() => FORM_FIELDS, []);

  const setField = useCallback(
    (key: keyof ProfileFormState) => (value: string) =>
      setProfile((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const validateProfile = useCallback(() => {
    const emptyFields = REQUIRED_FIELDS.filter(
      ({ key }) => !profile[key]?.trim(),
    ).map(({ label }) => label);

    return emptyFields.length === 0
      ? { valid: true as const }
      : {
          valid: false as const,
          message: `${emptyFields.join("、")}を入力してください`,
        };
  }, [profile]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      const validation = validateProfile();
      if (!validation.valid) {
        window.alert(validation.message);
        return;
      }

      setSaving(true);

      try {
        await apis.profiles.updateMyProfile({
          userProfileUpdateRequest: {
            profileData: {
              displayName: profile.name,
              furigana: profile.furigana,
              grade: profile.grade,
              faculty: profile.faculty,
              facultyDetail: profile.facultyDetail,
              hobby: profile.hobby,
              favoriteArtist: profile.favoriteArtist,
            },
            revisionMeta: {
              source: "web",
              at: new Date().toISOString(),
            },
          },
        });

        // Navigate to returnTo URL if provided, otherwise go to profile page
        navigate(returnTo || "/me/profile", { replace: true });
      } catch {
        setFormError("プロフィールの更新に失敗しました");
      } finally {
        setSaving(false);
      }
    },
    [navigate, profile, validateProfile, returnTo],
  );

  const previewRows = useMemo(
    () => [
      {
        label: "名前",
        value: profile.name
          ? `${profile.name}（${profile.furigana || "フリガナ"}）`
          : "—",
      },
      { label: "学年", value: profile.grade || "—" },
      { label: "学部", value: profile.faculty || "—" },
      { label: "趣味", value: profile.hobby || "—" },
      { label: "好きなアーティスト", value: profile.favoriteArtist || "—" },
    ],
    [profile],
  );

  return (
    <Stack gap="md">
      {formError && (
        <Alert color="red" title="エラー">
          <Text size="sm">{formError}</Text>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {formFields.map((field) => {
            if (field.type === "select") {
              return (
                <Select
                  key={String(field.id)}
                  label={field.label}
                  placeholder={field.placeholder ?? "選択してください"}
                  data={(field.options ?? []).map((opt) => ({
                    value: opt,
                    label: opt,
                  }))}
                  value={profile[field.id]}
                  onChange={(v) => setField(field.id)(v ?? "")}
                  required={field.required}
                  withAsterisk={field.required}
                  searchable
                  clearable
                />
              );
            }

            return (
              <TextInput
                key={String(field.id)}
                label={field.label}
                placeholder={field.placeholder}
                value={profile[field.id]}
                onChange={(e) => setField(field.id)(e.currentTarget.value)}
                required={field.required}
                withAsterisk={field.required}
                autoFocus={field.autoFocus}
              />
            );
          })}

          <Stack gap="sm">
            <Button type="submit" disabled={saving} fullWidth loading={saving}>
              保存
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => navigate("/me/profile")}
              disabled={saving}
              fullWidth
            >
              キャンセル
            </Button>
          </Stack>
        </Stack>
      </form>

      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          プレビュー
        </Text>
        <Card withBorder radius="lg" padding="md">
          <Stack gap="xs">
            {previewRows.map((r, idx) => (
              <Stack key={r.label} gap={6}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Text fw={700} c="#065f46" style={{ minWidth: 120 }}>
                    {r.label}
                  </Text>
                  <Text style={{ flex: 1 }}>{r.value}</Text>
                </Group>
                {idx !== previewRows.length - 1 ? <Divider /> : null}
              </Stack>
            ))}
          </Stack>
        </Card>
      </Stack>
    </Stack>
  );
}

export function EditMyProfileScreen() {
  return (
    <Container title="プロフィール編集">
      <Suspense
        fallback={
          <Text size="sm" c="dimmed">
            読み込み中...
          </Text>
        }
      >
        <EditProfileForm />
      </Suspense>
    </Container>
  );
}

EditMyProfileScreen.loader = loader;

