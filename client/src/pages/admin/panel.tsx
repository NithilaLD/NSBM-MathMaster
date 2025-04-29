import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Database, Play } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const { quizState, startQuiz, loading } = useQuiz();
  const [location, navigate] = useLocation();

  // Redirect to login if not authenticated or not an admin
  useEffect(() => {
    if (!user) {
      navigate("/");
    } else if (user.role !== "admin" && user.role !== "superadmin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch questions
  const { data: questions } = useQuery({
    queryKey: ['/api/questions'],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
  });

  // Fetch users (students only)
  const { data: allUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
  });

  const handleBack = () => {
    logout();
  };

  const handleStartQuiz = async () => {
    await startQuiz();
  };

  const handleAddQuestion = () => {
    navigate("/admin/add-question");
  };

  const handleImportQuestions = () => {
    navigate("/admin/questions");
  };

  const handleManageStudents = () => {
    navigate("/admin/students");
  };

  // Count students (users with role "student")
  const studentCount = allUsers ? allUsers.filter((u: any) => u.role === 'student').length : 0;

  if (!user) return null;

  return (

    <div className="relative min-h-[78vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      <video
      src="/images/bg_video2.mp4"
      autoPlay
      loop
      muted
      className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover"
      />
      
      <motion.div 
      className="relative z-10 flex flex-col p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      >
      {/* <div className="flex items-center justify-between mb-6">
        <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center text-primary-600 hover:text-primary-800"
        onClick={handleBack}
        >
        <ArrowLeft className="h-5 w-5 mr-1" />
        Back
        </Button>
        
      </div> */}
      
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-green-600 mb-6 text-center">Admin Panel</h1><br/>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Quiz Status</h2>
            <Badge variant={quizState === 'waiting' ? 'outline' : 'default'}>
            {quizState === 'waiting' ? 'Not Started' : 'In Progress'}
            </Badge>
          </div>
          <p className="text-gray-600 mb-4">Students in waiting room: <span className="font-semibold">{studentCount}</span></p>
          <Button 
            className="w-full"
            onClick={handleStartQuiz}
            disabled={quizState !== 'waiting' || loading}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Quiz
          </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Question Database</h2>
          <p className="text-gray-600 mb-4">Total questions: <span className="font-semibold">{questions ? questions.length : 0}</span> / 80</p>
          <div className="flex space-x-2">
            <Button 
            className="flex-1" 
            onClick={handleAddQuestion}
            >
            <Database className="h-4 w-4 mr-2" />
            Add Questions
            </Button>
            {/* <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleImportQuestions}
            >
            Import JSON
            </Button> */}
          </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Student Accounts</h2>
          <p className="text-gray-600 mb-4">Registered students: <span className="font-semibold">{studentCount}</span></p>
          {/* <Button 
            variant="outline" 
            className="w-full"
            onClick={handleManageStudents}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Students
          </Button> */}
          </CardContent>
        </Card>
        </div>
        
        {/* <div className="flex justify-end mt-4">
        <Button 
          variant="outline" 
          onClick={() => navigate("/leaderboard")}
        >
          View Leaderboard
        </Button>
        </div> */}
      </div>
      </motion.div>
    </div>
  );
}
