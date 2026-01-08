import { Alert, Text } from "@mantine/core";
import { ReactNode } from "react";

interface InfoAlertProps {
  title: string;
  children: ReactNode;
  color?: "blue" | "green" | "yellow" | "orange" | "red" | "gray";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * 説明用のAlert統一コンポーネント
 * 各画面で使われている情報提供用のAlertを統一
 */
export function InfoAlert({ 
  title, 
  children, 
  color = "blue", 
  size = "sm" 
}: InfoAlertProps) {
  return (
    <Alert color={color} title={title}>
      {typeof children === "string" ? (
        <Text size={size}>{children}</Text>
      ) : (
        children
      )}
    </Alert>
  );
}