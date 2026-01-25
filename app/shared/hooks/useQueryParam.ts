import { useMemo } from "react";
import { useLocation } from "react-router-dom";

/**
 * URL クエリパラメータを取得するhook
 * パラメータが存在しない場合は defaultValue を返す
 */
export function useQueryParam(
  paramName: string,
  defaultValue: string = "",
): string {
  const location = useLocation();

  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get(paramName) ?? defaultValue;
  }, [location.search, paramName, defaultValue]);
}

/**
 * 複数のクエリパラメータを一度に取得するhook
 */
export function useQueryParams(
  paramNames: string[],
): Record<string, string | null> {
  const location = useLocation();

  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    const result: Record<string, string | null> = {};
    for (const paramName of paramNames) {
      result[paramName] = params.get(paramName);
    }
    return result;
  }, [location.search, paramNames]);
}

/**
 * 全てのクエリパラメータをオブジェクトとして取得するhook
 */
export function useAllQueryParams(): Record<string, string> {
  const location = useLocation();

  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    const result: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }, [location.search]);
}
