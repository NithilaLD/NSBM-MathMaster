import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Question } from "@shared/schema";
import { AlertDialog, AlertDialogContent, AlertDialogTrigger, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import { useQuiz } from "@/context/QuizContext";

interface QuestionDisplayProps {
  question: Question;
  onSubmit: (answer: string) => void;
  currentIndex: number;
  totalQuestions: number;
  disabled?: boolean;
}

export default function QuestionDisplay({
  question,
  onSubmit,
  currentIndex,
  totalQuestions,
  disabled: isDisabled = false
}: QuestionDisplayProps) {
  const { userAnswers } = useQuiz();
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(
    () => userAnswers.get(question.id) || undefined
  );

  // Update selected answer when userAnswers changes
  useEffect(() => {
    const answer = userAnswers.get(question.id);
    if (answer) {
      setSelectedAnswer(answer);
    }
  }, [userAnswers, question.id]);

  const handleAnswerChange = (value: string) => {
    setSelectedAnswer(value);
    onSubmit(value);
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-600">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {question.difficulty}
          </span>
        </div>

        {/* Question Content */}
        <div className="space-y-4">
          {question.isImage && question.questionImage && (
            <div className="relative">
              <div className="relative group">
                <img 
                  src={`/uploads/${question.questionImage}`} 
                  alt="Question" 
                  className="w-full h-auto max-h-[300px] object-contain rounded-lg border border-gray-200"
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-4xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Question Image</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="mt-4">
                      <img 
                        src={`/uploads/${question.questionImage}`} 
                        alt="Question Full Size"
                        className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
          {question.questionText && (
            <p className="text-lg font-medium text-gray-900">{question.questionText}</p>
          )}
        </div>
      </div>
      <div className="flex justify-center w-full mt-4">
      <RadioGroup
        value={selectedAnswer}
        onValueChange={handleAnswerChange}
        className="flex space-x-4 mt-4"
        disabled={isDisabled}
      >
        {[
          { value: "A", text: question.optionA },
          { value: "B", text: question.optionB },
          { value: "C", text: question.optionC },
          { value: "D", text: question.optionD }
        ].map(({ value, text }) => (
          <Label
            key={value}
            className={`flex items-center p-3 cursor-pointer transition-all
              ${selectedAnswer === value 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200 hover:bg-gray-50'}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RadioGroupItem value={value} className="mt-0" />
            <span className="ml-3 text-gray-700">{text}</span>
          </Label>
        ))}
      </RadioGroup>
      </div>
    </Card>
  );
}
