export type ExamAttempt = {
  date: string;
  score: number;
  total: number;
  percentage: number;
  flaggedCount: number;
  timeTaken: number;

  questionStats: Record<number, number>;

  userAnswers: Record<number, number>;
  domainPerformance: Record<string, number>;
  
  questions: any[];
  flaggedQuestions: number[];
};

const STORAGE_KEY = "pl300_attempts";

export const getAttempts = (): ExamAttempt[] => {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  return JSON.parse(data);
};

export const saveAttempt = (
  attempt: ExamAttempt
) => {
  const attempts = getAttempts();

  attempts.push(attempt);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(attempts)
  );
};