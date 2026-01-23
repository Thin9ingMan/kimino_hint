import { Button, Stack, Text, TextInput, Box, Image } from "@mantine/core";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { normalizeBaseUrlPath } from "@/shared/utils";

interface QrGeneratorProps {
  baseUrl?: string;
  pathTemplate?: string; // e.g., "/profiles/{userId}"
  qrSize?: number;
  showUrlInput?: boolean;
  showDirectLink?: boolean;
  placeholder?: string;
  label?: string;
}

/**
 * QRコード生成コンポーネント
 * QrHubScreen で使用されるQRコード生成ロジックを分離・再利用可能にする
 */
export function QrGenerator({
  baseUrl,
  pathTemplate = "/profiles/{userId}",
  qrSize = 220,
  showUrlInput = true,
  showDirectLink = true,
  placeholder = "例: 42",
  label = "userId",
}: QrGeneratorProps) {
  const [userIdText, setUserIdText] = useState("");

  const base = useMemo(() => {
    return baseUrl || normalizeBaseUrlPath();
  }, [baseUrl]);

  const shareUrl = useMemo(() => {
    const raw = userIdText.trim();
    if (!raw) return "";
    const n = Number(raw);
    if (!Number.isFinite(n)) return "";
    
    const path = pathTemplate.replace("{userId}", String(n));
    return `${window.location.origin}${base}${path.startsWith("/") ? path.slice(1) : path}`;
  }, [base, userIdText, pathTemplate]);

  const imageUrl = useMemo(() => {
    if (!shareUrl) return "";
    const data = encodeURIComponent(shareUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${data}`;
  }, [shareUrl, qrSize]);

  const userIdNumber = useMemo(() => {
    const raw = userIdText.trim();
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [userIdText]);

  return (
    <Stack gap="md">
      {showUrlInput && (
        <TextInput
          label={label}
          placeholder={placeholder}
          value={userIdText}
          onChange={(e) => setUserIdText(e.currentTarget.value)}
        />
      )}

      {shareUrl ? (
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            共有URL:
          </Text>
          <Text size="sm" style={{ wordBreak: "break-all" }}>
            {shareUrl}
          </Text>
          
          <Box style={{ textAlign: "center" }}>
            <Image
              src={imageUrl}
              alt="QR Code"
              w={qrSize}
              h={qrSize}
              fit="contain"
              fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' dy='.3em'%3EQR生成中...%3C/text%3E%3C/svg%3E"
            />
          </Box>

          {showDirectLink && userIdNumber && (
            <Button
              component={Link}
              to={pathTemplate.replace("{userId}", String(userIdNumber))}
              variant="default"
              fullWidth
            >
              プロフィール詳細を開く
            </Button>
          )}
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          {label} を入力すると QR と共有URLが表示されます。
        </Text>
      )}
    </Stack>
  );
}