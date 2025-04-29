import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import QuestionDisplay from "@/components/quiz/question-display";

export default function Quiz() {
  const { user } = useAuth();
  const {
    quizState,
    questions,
    currentQuestionIndex,
    userAnswers,
    timeRemaining,
    submitAnswer,
    nextQuestion,
    loading,
    completed,
  } = useQuiz();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Calculate current batch of questions
  const currentBatchStart = Math.floor(currentQuestionIndex / 4) * 4;
  const currentBatchQuestions = questions.slice(currentBatchStart, currentBatchStart + 4);

  useEffect(() => {
    if (loading) {return;}
    else if (!user) {navigate("/");}
    else if (quizState !== "started")
    {
      if (quizState === "waiting") {navigate("/rules");}
      else if (quizState === "completed") {navigate("/studentleaderboard");}
    }
  }, [user, quizState, loading, navigate]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 flex-col">
        <div className="animate-pulse text-primary-600 font-semibold mb-4">
          Loading quiz...
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 flex-col">
        <div className="text-primary-600 font-semibold text-xl mb-4">
          Waiting for questions...
        </div>
        <Button 
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/quiz/settings'] });
            queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
            toast({
              title: "Refreshing data",
              description: "Attempting to reload quiz data...",
            });
          }}
          variant="outline"
          className="mt-2"
        >
          Refresh Data
        </Button>
      </div>
    );
  }

  const timerPercentage = (timeRemaining / 3600) * 100;
  const isLastBatch = currentBatchStart + 4 >= questions.length;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video
          src="/images/bg_video2.mp4"
          autoPlay
          loop
          muted
          className="w-full h-full object-cover"
        />
      </div>

      <motion.div 
        className="relative z-10 min-h-screen flex flex-col p-4 w-full max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold text-gray-800">
                NSBM MathMaster Quiz
                {completed && <span className="ml-2 text-sm text-gray-500">(Completed)</span>}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <span className="font-bold text-primary-700">
                    Questions {currentBatchStart + 1}-{Math.min(currentBatchStart + 4, questions.length)}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-500">
                    {questions.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <Progress value={timerPercentage} className="h-2.5" />
              <div className="mt-1 text-right text-sm text-gray-500">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} minutes remaining
              </div>
            </div>

            <div className="space-y-8">
              {/* Top Section - 2 Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentBatchQuestions.slice(0, 2).map((question, idx) => (
                  <QuestionDisplay
                    key={question.id}
                    question={question}
                    onSubmit={(answer) => submitAnswer(question.id, answer)}
                    currentIndex={currentBatchStart + idx}
                    totalQuestions={questions.length}
                    disabled={completed}
                  />
                ))}
              </div>

              {/* Bottom Section - 2 Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentBatchQuestions.slice(2, 4).map((question, idx) => (
                  <QuestionDisplay
                    key={question.id}
                    question={question}
                    onSubmit={(answer) => submitAnswer(question.id, answer)}
                    currentIndex={currentBatchStart + idx + 2}
                    totalQuestions={questions.length}
                    disabled={completed}
                  />
                ))}
              </div>


            </div>

            <div className="flex justify-end mt-8">
              <Button
                onClick={() => {
                  for (let i = 0; i < 4; i++) {
                    nextQuestion();
                  }
                }}
                disabled={loading || completed}
              >
                {completed
                  ? "Already Submitted"
                  : isLastBatch
                  ? "Finish Quiz"
                  : "Next Set"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-md font-semibold text-gray-800 mb-4">Progress</h3>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((question, index) => {
                const answer = userAnswers.get(question.id);
                let bgColor = "bg-gray-300 text-white-500";



                if (index >= currentBatchStart && index < currentBatchStart + 4) {
                  bgColor = "bg-blue-300 text-white-500";
                }
                else if (index <= currentBatchStart && index > currentBatchStart - 5) {
                  bgColor = "bg-green-300 text-white-500";
                }

                return (
                  <div 
                    key={question.id}
                    className={`h-8 w-full flex items-center justify-center rounded-md text-xs font-medium ${bgColor}`}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}