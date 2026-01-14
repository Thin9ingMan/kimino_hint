import { useSuspenseQuery } from "@/shared/hooks/useSuspenseQuery";
import { apis } from "@/shared/api";
import type { QuizUserData } from "../types";

/**
 * Hook to fetch quiz data for a specific user in an event
 */
export function useQuizData(eventId: number, userId: number) {
  const data = useSuspenseQuery(
    ["quiz", "eventUserData", eventId, userId],
    () => apis.events.getEventUserData({ eventId, userId })
  );

  const quizData: QuizUserData = (data?.userData as QuizUserData) ?? {};

  return { quizData, rawData: data };
}

/**
 * Hook to fetch the current user's quiz data
 */
export function useMyQuizData(eventId: number, userId: number) {
  return useQuizData(eventId, userId);
}
