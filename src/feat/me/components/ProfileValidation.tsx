import { Alert, List, Text } from "@mantine/core";
import { ProfileFormState } from "./ProfileFormFields";

export const REQUIRED_FIELDS: Array<{ key: keyof ProfileFormState; label: string }> = [
  { key: "name", label: "名前" },
  { key: "faculty", label: "学部" },
  { key: "grade", label: "学年" },
  { key: "hobby", label: "趣味" },
  { key: "favoriteArtist", label: "好きなアーティスト" },
];

export interface ValidationResult {
  valid: boolean;
  message?: string;
  missingFields?: string[];
}

/**
 * プロフィールフォームのバリデーション関数
 */
export function validateProfileForm(profile: ProfileFormState): ValidationResult {
  const emptyFields = REQUIRED_FIELDS.filter(({ key }) => !profile[key]?.trim()).map(
    ({ label }) => label
  );

  return emptyFields.length === 0
    ? { valid: true }
    : {
        valid: false,
        message: `${emptyFields.join("、")}を入力してください`,
        missingFields: emptyFields,
      };
}

interface ProfileValidationDisplayProps {
  validation: ValidationResult;
  showSuccess?: boolean;
  variant?: "alert" | "list" | "text";
}

/**
 * プロフィールバリデーション結果の表示コンポーネント
 */
export function ProfileValidationDisplay({
  validation,
  showSuccess = false,
  variant = "alert",
}: ProfileValidationDisplayProps) {
  if (validation.valid) {
    if (!showSuccess) return null;
    
    if (variant === "alert") {
      return (
        <Alert color="green" title="入力完了">
          <Text size="sm">すべての必須項目が入力されています。</Text>
        </Alert>
      );
    }
    
    return (
      <Text size="sm" c="green">
        ✓ すべての必須項目が入力済み
      </Text>
    );
  }

  // バリデーションエラーがある場合
  if (variant === "list" && validation.missingFields) {
    return (
      <Alert color="yellow" title="入力が必要な項目">
        <List size="sm">
          {validation.missingFields.map((field, index) => (
            <List.Item key={index}>{field}</List.Item>
          ))}
        </List>
      </Alert>
    );
  }

  if (variant === "text") {
    return (
      <Text size="sm" c="orange">
        {validation.message}
      </Text>
    );
  }

  return (
    <Alert color="orange" title="入力チェック">
      <Text size="sm">{validation.message}</Text>
    </Alert>
  );
}