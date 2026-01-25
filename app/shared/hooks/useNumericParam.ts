import { useMemo } from "react";
import { useParams } from "react-router-dom";

/**
 * URL パラメータを数値として取得するhook
 * パラメータが存在しないか無効な数値の場合は null を返す
 */
export function useNumericParam(paramName: string): number | null {
  const params = useParams();

  return useMemo(() => {
    const raw = params[paramName] ?? "";
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params, paramName]);
}

/**
 * 複数のURLパラメータを数値として取得するhook
 */
export function useNumericParams(
  ...paramNames: string[]
): Record<string, number | null> {
  const params = useParams();

  return useMemo(() => {
    const result: Record<string, number | null> = {};
    for (const paramName of paramNames) {
      const raw = params[paramName] ?? "";
      const n = Number(raw);
      result[paramName] = Number.isFinite(n) ? n : null;
    }
    return result;
  }, [params, paramNames]);
}
