import { Button, Stack, TextInput } from "@mantine/core";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface InvitationCodeInputProps {
  label?: string;
  placeholder?: string;
  buttonText?: string;
  onSubmit?: (code: string) => void;
  navigateTo?: string;
  includeStateData?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  initialValue?: string;
}

/**
 * 招待コード入力部品
 * EventsHubScreen で使用される招待コード入力+ボタンのセットを統一
 */
export function InvitationCodeInput({
  label = "招待コード（ショートカット）",
  placeholder = "例: QUIZ-2025-01",
  buttonText = "このコードで参加する",
  onSubmit,
  navigateTo = "/events/join",
  includeStateData = true,
  fullWidth = true,
  disabled = false,
  initialValue = "",
}: InvitationCodeInputProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState(initialValue);

  const trimmed = useMemo(() => code.trim(), [code]);

  const handleSubmit = () => {
    if (!trimmed || disabled) return;

    if (onSubmit) {
      onSubmit(trimmed);
    } else {
      // Default behavior: navigate with state
      const navigationOptions = includeStateData
        ? { state: { invitationCode: trimmed } }
        : undefined;
      
      navigate(navigateTo, navigationOptions);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && trimmed && !disabled) {
      handleSubmit();
    }
  };

  return (
    <Stack gap="sm">
      <TextInput
        label={label}
        placeholder={placeholder}
        value={code}
        onChange={(e) => setCode(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <Button
        onClick={handleSubmit}
        disabled={!trimmed || disabled}
        fullWidth={fullWidth}
      >
        {buttonText}
      </Button>
    </Stack>
  );
}