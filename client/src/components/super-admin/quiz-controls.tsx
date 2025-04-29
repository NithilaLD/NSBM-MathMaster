import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, AlertTriangle } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";

interface QuizStatus {
  id: number;
  active: boolean;
  lastReset: Date;
}

interface QuizControlsProps {
  quizStatus?: QuizStatus;
  isLoading: boolean;
  onStartQuiz: () => void;
  onResetQuiz: () => void;
}

export default function QuizControls({ 
  quizStatus, 
  isLoading, 
  onStartQuiz, 
  onResetQuiz 
}: QuizControlsProps) {
  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`${queryKey[0]}?role=student`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch students");
      }
      return res.json();
    },
  });
  
  // Fetch questions
  const { data: questions = [] } = useQuery({
    queryKey: ["/api/questions"],
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading quiz status...</p>
      </div>
    );
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const isActive = quizStatus?.active || false;
  const lastReset = quizStatus?.lastReset;
  
  const totalStudents = students.length;
  const totalQuestions = questions.length;
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Quiz Controls</h2>
      
      <Card className="p-6 bg-white rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Quiz Status</h3>
            <p className="text-gray-600 mb-4">
              Current status: <span className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
            {lastReset && (
              <p className="text-sm text-gray-500">
                Last reset: {formatDate(lastReset)}
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={onStartQuiz}
              disabled={isActive}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
            >
              <Play className="mr-2 h-4 w-4" /> Start Quiz
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Reset Quiz
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Quiz and Leaderboard?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will reset the quiz status and clear all student results and answers. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onResetQuiz}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Yes, Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quiz Status Summary</h3>
          
          <ul className="space-y-4">
            <li className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Students Registered:</span>
              <span className="font-medium">{totalStudents}</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Questions Available:</span>
              <span className="font-medium">{totalQuestions}</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Quiz Active:</span>
              <span className="font-medium">{isActive ? 'Yes' : 'No'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">Quiz Mode:</span>
              <span className="font-medium">Sequential (1 min per question)</span>
            </li>
          </ul>
        </Card>
        
        <Card className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Checks</h3>
          
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${totalQuestions >= 10 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'} flex items-start`}>
              <div className={`p-1 rounded-full ${totalQuestions >= 10 ? 'bg-green-100' : 'bg-yellow-100'} mr-3 mt-0.5`}>
                {totalQuestions >= 10 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="font-medium">Question Count</p>
                <p className="text-sm mt-1">
                  {totalQuestions >= 10 
                    ? `${totalQuestions} questions available (recommended: 50)` 
                    : `Only ${totalQuestions} questions available, recommended: at least 10`}
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${totalStudents > 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'} flex items-start`}>
              <div className={`p-1 rounded-full ${totalStudents > 0 ? 'bg-green-100' : 'bg-yellow-100'} mr-3 mt-0.5`}>
                {totalStudents > 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="font-medium">Student Registration</p>
                <p className="text-sm mt-1">
                  {totalStudents > 0 
                    ? `${totalStudents} students registered` 
                    : `No students registered yet`}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
