import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Question, QuizSetting, QuizAnswer, Result } from '@shared/schema';
import { useAuth } from './AuthContext';

interface QuizContextType {
  quizState: 'waiting' | 'started' | 'completed';
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Map<number, string | null>;
  timeRemaining: number;
  startQuiz: () => Promise<void>;
  resetQuiz: () => Promise<void>;
  submitAnswer: (questionId: number, answer: string | null) => Promise<void>;
  nextQuestion: () => void;
  submitQuiz: () => Promise<void>;
  loading: boolean;
  error: string | null;
  score: number | null;
  quizResult: Result | null;
  completed: boolean;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const webSocketRef = useRef<WebSocket | null>(null);

  const [quizState, setQuizState] = useState<'waiting' | 'started' | 'completed'>('waiting');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<number, string | null>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(() => {
    // Try to get saved time from localStorage
    const savedTime = localStorage.getItem('quizTimeRemaining');
    return savedTime ? parseInt(savedTime, 10) : 3600;
  });
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<Result | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);

  // Save time to localStorage whenever it changes
  useEffect(() => {
    if (quizState === 'started') {
      localStorage.setItem('quizTimeRemaining', timeRemaining.toString());
    }
  }, [timeRemaining, quizState]);

  // Clear timer when quiz state changes or component unmounts
  useEffect(() => {
    if (quizState !== 'started') {
      localStorage.removeItem('quizTimeRemaining');
    }
    return () => {
      if (quizState !== 'started') {
        localStorage.removeItem('quizTimeRemaining');
      }
    };
  }, [quizState]);

  // Timer effect for the entire quiz
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (quizState === 'started' && questions.length > 0) {
      // Check if there's a saved time, otherwise start with 3600 seconds
      if (!localStorage.getItem('quizTimeRemaining')) {
        setTimeRemaining(3600);
        localStorage.setItem('quizTimeRemaining', '3600');
      }

      timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            if (timer) clearInterval(timer);
            setTimeout(() => submitQuiz(), 0);
            return 0;
          }
          localStorage.setItem('quizTimeRemaining', newTime.toString());
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [quizState, questions.length]);

  // Cleanup localStorage when quiz ends or unmounts
  useEffect(() => {
    if (quizState !== 'started' || completed) {
      localStorage.removeItem('quizTimeRemaining');
      localStorage.removeItem('currentBatch');
    }
    return () => {
      if (quizState !== 'started' || completed) {
        localStorage.removeItem('quizTimeRemaining');
        localStorage.removeItem('currentBatch');
      }
    };
  }, [quizState, completed]);

  // Connect to WebSocket for real-time quiz state updates
  // WebSocket connection for real-time quiz updates
  useEffect(() => {
    // Feature flag to determine if WebSockets should be used
    // Set to false if you're having persistent connection issues
    const ENABLE_WEBSOCKETS = false;

    // If WebSockets are disabled, rely on polling
    if (!ENABLE_WEBSOCKETS) {
      console.log('WebSockets disabled, using polling for updates');
      return;
    }

    // Connection state
    let reconnectAttempts = 0;
    let lastPongTime = 0; 
    let pingInterval: NodeJS.Timeout | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let pongCheckTimeout: NodeJS.Timeout | null = null;

    // Constants
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000; // ms
    const PING_INTERVAL = 20000; // ms
    const PONG_TIMEOUT = 10000; // ms

    function setupWebSocket(): WebSocket | null {
      try {
        // Clean up existing connection if any
        if (webSocketRef.current) {
          try {
            webSocketRef.current.close();
          } catch (err) {
            console.error('Error closing existing connection:', err);
          }
        }

        // Improved URL construction specifically for Replit's environment
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        // Get hostname and ensure we use the proper domain for Replit
        const hostname = window.location.hostname;

        // Set URL based on environment
        let wsUrl;
        if (hostname.includes('.repl.co') || hostname.includes('.replit.dev')) {
          // For Replit environment, use the hostname without port
          wsUrl = `${protocol}//${hostname}/ws`;
        } else {
          // For local development, include port
          wsUrl = `${protocol}//${window.location.host}/ws`;
        }

        console.log(`Connecting to WebSocket: ${wsUrl} (Hostname: ${hostname})`);

        // Create new connection
        const socket = new WebSocket(wsUrl);
        webSocketRef.current = socket;

        // Set up event handlers
        socket.onopen = () => {
          console.log('WebSocket connection established');
          reconnectAttempts = 0;
          lastPongTime = Date.now();

          // Start sending pings
          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => sendPing(socket), PING_INTERVAL);

          // Send initial ping
          sendPing(socket);
        };

        socket.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);

            if (data.type === 'PONG') {
              lastPongTime = Date.now();
              console.log('Received PONG, connection healthy');
              return;
            }

            if (data.type === 'QUIZ_STATE_UPDATE' && data.payload) {
              console.log('Quiz state update:', data.payload);

              // Update state based on server message
              setQuizState(data.payload.state);

              // Navigate if needed
              if (data.payload.state === 'started' && location === '/waiting-room') {
                navigate('/quiz');
              }

              // Refresh questions if needed
              if (data.payload.state === 'started') {
                queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
              }
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        socket.onerror = (event: Event) => {
          console.error('WebSocket error:', event);
          // Fall back to polling
          refetchSettings();
        };

        socket.onclose = (event: CloseEvent) => {
          console.log(`WebSocket closed: ${event.code} ${event.reason}`);
          cleanup();

          // Try to reconnect
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

            // Use exponential backoff
            const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1);
            reconnectTimeout = setTimeout(setupWebSocket, delay);
          } else {
            console.log('Max reconnection attempts reached');
            toast({
              title: "Connection Lost",
              description: "Using fallback polling method for updates.",
              variant: "default"
            });
          }
        };

        return socket;
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        return null;
      }
    }

    function sendPing(socket: WebSocket) {
      if (socket.readyState === WebSocket.OPEN) {
        console.log('Sending ping to server');
        socket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));

        // Set up check for pong response
        if (pongCheckTimeout) clearTimeout(pongCheckTimeout);
        pongCheckTimeout = setTimeout(() => {
          const now = Date.now();
          if (now - lastPongTime > PONG_TIMEOUT && lastPongTime > 0) {
            console.log('No pong received in time, closing connection');
            socket.close(1000, 'No pong response');
          }
        }, PONG_TIMEOUT);
      }
    }

    function cleanup() {
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pongCheckTimeout) clearTimeout(pongCheckTimeout);
    }

    // Initial connection
    setupWebSocket();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket resources');
      cleanup();

      if (webSocketRef.current) {
        try {
          if (webSocketRef.current.readyState === WebSocket.OPEN) {
            webSocketRef.current.close(1000, 'Component unmounting');
          }
        } catch (err) {
          console.error('Error closing WebSocket on cleanup:', err);
        }
      }
    };
  }, [location, navigate, toast]);

  // Fetch quiz settings using regular polling since WebSockets are disabled 
  const { data: quizSettings, isLoading: loadingSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['/api/quiz/settings'],
    refetchInterval: 3000, // Higher frequency polling (3 seconds) since WebSockets are disabled
  });

  // Use an effect to update state when quizSettings changes
  useEffect(() => {
    if (quizSettings && typeof quizSettings === 'object' && 'state' in quizSettings) {
      const state = quizSettings.state as string;
      if (state === 'waiting' || state === 'started' || state === 'completed') {
        console.log(`QuizContext: State changed to ${state}`);
        setQuizState(state as 'waiting' | 'started' | 'completed');

        // If quiz is started, make sure we redirect to quiz page and fetch questions
        if (state === 'started') {
          // Force invalidate questions cache when quiz starts
          queryClient.invalidateQueries({ queryKey: ['/api/questions'] });

          // Redirect to quiz if user is in waiting room
          if (location === '/waiting-room') {
            console.log('QuizContext: Redirecting from waiting room to quiz');
            navigate('/quiz');
          }

          // If we're already on quiz page, ensure questions are fetched
          if (location === '/quiz' && questions.length === 0) {
            console.log('QuizContext: On quiz page without questions, fetching questions');
            queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
          }
        }
      }
    }
  }, [quizSettings, location, navigate, queryClient, questions.length]);

  // Fetch questions - improved error handling and retry logic
  const { data: questionsData, isLoading: loadingQuestions, error: questionsError } = useQuery({
    queryKey: ['/api/questions'],
    enabled: quizState === 'started' && !!user,
    retry: 3, // Retry up to 3 times if fetch fails
  });

  // Use effect to handle questions data
  useEffect(() => {
    if (questionsData) {
      console.log("QuizContext: Fetched questions:", questionsData);
      if (Array.isArray(questionsData)) {
        // Update questions state with the fetched data
        setQuestions(questionsData);

        // If questions were loaded successfully but there are none, show an error
        if (questionsData.length === 0) {
          console.log("QuizContext: No questions available in the fetched data");
          setError("No questions available for this quiz. Please contact an administrator.");
          toast({
            title: "No Questions Available",
            description: "There are no questions in this quiz. Please contact an administrator.",
            variant: "destructive"
          });
        } else {
          console.log(`QuizContext: Successfully loaded ${questionsData.length} questions`);
          // Clear any previous errors when questions load successfully
          setError(null);
        }
      } else {
        console.error("QuizContext: Failed to load questions: Not an array", questionsData);
        setError("Failed to load questions. Please refresh the page.");
        toast({
          title: "Error Loading Questions",
          description: "There was a problem loading the quiz questions. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [questionsData, toast]);

  // Add a safety check to force fetch questions if quiz is started but we have no questions
  useEffect(() => {
    if (quizState === 'started' && questions.length === 0 && !loadingQuestions && !questionsError) {
      console.log("QuizContext: Quiz started but no questions loaded, forcing refetch");
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
    }
  }, [quizState, questions.length, loadingQuestions, questionsError, queryClient]);

  // Handle question fetch errors
  useEffect(() => {
    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      setError("Failed to load questions. Please refresh the page.");
      toast({
        title: "Error Loading Questions",
        description: "There was a problem loading the quiz questions. Please try again.",
        variant: "destructive"
      });
    }
  }, [questionsError, toast]);

  // Fetch user quiz answers (for resuming a quiz)
  const { data: userAnswersData, isLoading: loadingAnswers } = useQuery({
    queryKey: ['/api/quiz/answers'],
    enabled: quizState === 'started' && !!user,
  });

  // Process user answers when data changes
  useEffect(() => {
    if (userAnswersData && Array.isArray(userAnswersData)) {
      const answersMap = new Map<number, string | null>();
      userAnswersData.forEach(answer => {
        if (answer.questionId && answer.userAnswer !== undefined) {
          answersMap.set(answer.questionId, answer.userAnswer);
        }
      });
      setUserAnswers(answersMap);

      // Set current question index based on answered questions
      if (userAnswersData.length > 0 && userAnswersData.length < questions.length) {
        setCurrentQuestionIndex(userAnswersData.length);
      }
    }
  }, [userAnswersData, questions.length]);

  // Fetch user results
  const { data: resultData, isLoading: loadingResult } = useQuery({
    queryKey: ['/api/results/me'],
    enabled: !!user,
  });

  // Process result data when it changes
  useEffect(() => {
    if (resultData) {
      // Safely type cast the result data
      if (typeof resultData === 'object' && 'score' in resultData) {
        // Safe to cast as the Result type
        const typedResult = resultData as Result;
        setQuizResult(typedResult);
        setScore(typedResult.score);
      }
    }
  }, [resultData]);

  // Start quiz mutation (admin only)
  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/quiz/start', {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz started",
        description: "The quiz has been started for all students.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quiz/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start quiz",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Reset quiz mutation (superadmin only)
  const resetQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/quiz/reset', {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz reset",
        description: "The quiz and leaderboard have been reset.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quiz/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/results'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reset quiz",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number, answer: string | null }) => {
      if (!user) throw new Error("User not authenticated");

      const res = await apiRequest('POST', '/api/quiz/answers', {
        userId: user.id,
        questionId,
        userAnswer: answer,
        responseTimeSeconds: 3600 - timeRemaining
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz/answers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit answer",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Submit quiz results mutation
  const submitResultsMutation = useMutation({
    mutationFn: async (resultData: {
      score: number;
      correctAnswers: number;
      incorrectAnswers: number;
      skippedAnswers: number;
      averageResponseTime: number;
      completionTime: number;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const res = await apiRequest('POST', '/api/results', {
        userId: user.id,
        ...resultData
      });
      return res.json();
    },
    onSuccess: (data) => {
      const typedData = data as Result;
      setQuizResult(typedData);
      setScore(typedData.score);
      navigate('/studentleaderboard'); // Updated redirection
      queryClient.invalidateQueries({ queryKey: ['/api/results'] });
      setCompleted(true);
    },
    onError: (error: any) => {
    }
  });

  // Submit answer function with optimistic updates
  const submitAnswer = async (questionId: number, answer: string | null) => {
    try {
      const existingAnswer = userAnswers.get(questionId);

      // Skip if the answer is the same
      if (existingAnswer === answer) {
        return;
      }

      // Optimistically update UI
      const newAnswers = new Map(userAnswers);
      newAnswers.set(questionId, answer);
      setUserAnswers(newAnswers);

      // Submit to server in background
      submitAnswerMutation.mutate(
        { questionId, answer },
        {
          onError: (error) => {
            // Revert on error
            const revertAnswers = new Map(userAnswers);
            if (existingAnswer !== undefined) {
              revertAnswers.set(questionId, existingAnswer);
            }
            setUserAnswers(revertAnswers);
            console.error('Failed to submit answer:', error);
          }
        }
      );
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  // Next question function
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => Math.min(prev + 1, questions.length - 1));
      // Only reset timer when moving to a new batch of questions
      if ((currentQuestionIndex + 1) % 4 === 0) {
        setTimeRemaining(3600);
      }
    } else {
      // End of quiz
      submitQuiz();
    }
  };

  // Start quiz function (admin only)
  const startQuiz = async () => {
    try {
      await startQuizMutation.mutateAsync();
      // Return void to match the interface
    } catch (error) {
      console.error('Failed to start quiz:', error);
    }
  };

  // Reset quiz function (superadmin only)
  const resetQuiz = async () => {
    try {
      await resetQuizMutation.mutateAsync();
      // Return void to match the interface
    } catch (error) {
      console.error('Failed to reset quiz:', error);
    }
  };

  // Submit final results
  const submitQuiz = async () => {
    if (!user || questions.length === 0) return;
    if (completed) {
      toast({
        title: "Quiz Already Submitted",
        description: "You have already completed this quiz.",
        variant: "destructive",
      });
      return;
    }

    // Count the number of skipped questions
    let skippedCount = 0;
    let totalResponseTime = 0; 

    // Prepare an array of all answered questions
    const answeredQuestions = Array.from(userAnswers.entries()).map(([questionId, answer]) => {
      return { questionId, answer };
    });

    // Calculate skipped count
    skippedCount = questions.length - answeredQuestions.length;

    // Calculate total batches and remaining questions
    const fullBatches = Math.floor((currentQuestionIndex) / 4);
    const remainingQuestions = currentQuestionIndex % 4;

    // Calculate completion time as time spent (initial time - remaining time)
    const completionTime = 3600 - timeRemaining;


    // Calculate average response time for answered questions
    const averageTime = answeredQuestions.length > 0 
      ? Math.round(completionTime / answeredQuestions.length)
      : 0;

    // Let the server determine correct/incorrect counts and score
    await submitResultsMutation.mutateAsync({
      score: 0, // Server will recalculate this
      correctAnswers: 0, // Server will recalculate this
      incorrectAnswers: 0, // Server will recalculate this
      skippedAnswers: skippedCount,
      averageResponseTime: averageTime,
      completionTime: completionTime
    });
  };

    // Provide quiz context
  const value = {
    quizState,
    questions,
    currentQuestionIndex,
    userAnswers,
    timeRemaining,
    startQuiz,
    resetQuiz,
    submitAnswer,
    nextQuestion,
    submitQuiz,
    loading: loadingSettings || loadingQuestions || loadingAnswers || loadingResult || 
             startQuizMutation.isPending || resetQuizMutation.isPending || 
             submitAnswerMutation.isPending || submitResultsMutation.isPending,
    error,
    score,
    quizResult,
    completed
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

// Hook for using quiz context
export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
}