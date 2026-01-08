import { Select, Stack, TextInput } from "@mantine/core";
import { FACULTY_OPTIONS, GRADE_OPTIONS } from "@/shared/profile/options";

export type ProfileFormState = {
  name: string;
  furigana: string;
  grade: string;
  faculty: string;
  hobby: string;
  favoriteArtist: string;
  facultyDetail: string;
};

export type FormField = {
  id: keyof ProfileFormState;
  label: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  type?: "text" | "select";
  options?: readonly string[];
};

export const FORM_FIELDS: FormField[] = [
  { id: "name", label: "名前", placeholder: "名前", required: true, autoFocus: true },
  { id: "furigana", label: "フリガナ", placeholder: "フリガナ" },
  { id: "faculty", label: "学部", type: "select", options: FACULTY_OPTIONS },
  { id: "facultyDetail", label: "具体的な学部" },
  { id: "grade", label: "学年", type: "select", options: GRADE_OPTIONS },
  { id: "hobby", label: "趣味", placeholder: "趣味", required: true },
  {
    id: "favoriteArtist",
    label: "好きなアーティスト",
    placeholder: "好きなアーティスト",
    required: true,
  },
];

interface ProfileFormFieldsProps {
  profile: ProfileFormState;
  onFieldChange: (key: keyof ProfileFormState) => (value: string) => void;
  disabled?: boolean;
}

/**
 * プロフィール編集フォームフィールドの統一コンポーネント
 * EditMyProfileScreen で使用されるフォーム部分を分離
 */
export function ProfileFormFields({
  profile,
  onFieldChange,
  disabled = false,
}: ProfileFormFieldsProps) {
  return (
    <Stack gap="md">
      {FORM_FIELDS.map((field) => {
        const commonProps = {
          key: field.id,
          label: field.label,
          value: profile[field.id],
          disabled,
          required: field.required,
          autoFocus: field.autoFocus,
        };

        if (field.type === "select" && field.options) {
          return (
            <Select
              {...commonProps}
              placeholder={`${field.label}を選択`}
              data={Array.from(field.options)}
              onChange={(value) => onFieldChange(field.id)(value || "")}
              searchable
              clearable
            />
          );
        }

        return (
          <TextInput
            {...commonProps}
            placeholder={field.placeholder || field.label}
            onChange={(e) => onFieldChange(field.id)(e.currentTarget.value)}
          />
        );
      })}
    </Stack>
  );
}