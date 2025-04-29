import { apiRequest } from "./queryClient";
import { Question, QuizSetting, QuizAnswer, Result } from "@shared/schema";

/**
 * Fetch the current quiz settings
 * @returns Quiz settings object
 */
export async function fetchQuizSettings(): Promise<QuizSetting> {
  const response = await fetch('/api/quiz/settings', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch quiz settings: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Start the quiz (admin only)
 * @returns Updated quiz settings
 */
export async function startQuiz(): Promise<QuizSetting> {
  const response = await apiRequest('POST', '/api/quiz/start', {});
  return await response.json();
}

/**
 * Reset the quiz and leaderboard (super admin only)
 * @returns Updated quiz settings
 */
export async function resetQuiz(): Promise<QuizSetting> {
  const response = await apiRequest('POST', '/api/quiz/reset', {});
  return await response.json();
}

/**
 * Fetch all quiz questions
 * @returns Array of questions
 */
export async function fetchQuestions(): Promise<Question[]> {
  const response = await fetch('/api/questions', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch questions: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Submit an answer for a question
 * @param userId User ID
 * @param questionId Question ID
 * @param answer Selected answer (A, B, C, D, or null if skipped)
 * @param responseTimeSeconds Time taken to answer the question in seconds
 * @returns Saved answer object
 */
export async function submitAnswer(
  userId: number,
  questionId: number,
  answer: string | null,
  responseTimeSeconds: number
): Promise<QuizAnswer> {
  const response = await apiRequest('POST', '/api/quiz/answers', {
    userId,
    questionId,
    userAnswer: answer,
    responseTimeSeconds,
  });
  
  return await response.json();
}

/**
 * Fetch all answers for the current user
 * @returns Array of user's answers
 */
export async function fetchUserAnswers(): Promise<QuizAnswer[]> {
  const response = await fetch('/api/quiz/answers', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user answers: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Submit final quiz results
 * @param result Result data
 * @returns Saved result object with ranking
 */
export async function submitResults(result: {
  userId: number;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  averageResponseTime: number;
  completionTime: number;
}): Promise<Result> {
  const response = await apiRequest('POST', '/api/results', result);
  return await response.json();
}

/**
 * Fetch leaderboard data
 * @returns Array of results for the leaderboard
 */
export async function fetchLeaderboard(): Promise<Result[]> {
  const response = await fetch('/api/results', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetch current user's result
 * @returns User's result or null if not available
 */
export async function fetchUserResult(): Promise<Result | null> {
  try {
    const response = await fetch('/api/results/me', {
      credentials: 'include',
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user result: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user result:', error);
    return null;
  }
}
