import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, RefreshCw, Users, Settings, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
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
import { useToast } from "@/hooks/use-toast";

export default function SuperAdminPanel() {
  const { user, logout } = useAuth();
  const { quizState, startQuiz, resetQuiz, loading } = useQuiz();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect to login if not authenticated or not a super admin
  useEffect(() => {
    if (!user) {
      navigate("/");
    } else if (user.role !== "superadmin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch stats
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user && user.role === 'superadmin',
  });

  // const handleBack = () => {
  //   logout();
  // };

  const handleStartQuiz = async () => {
    await startQuiz();
    toast({
      title: "Quiz started",
      description: "The quiz has been started for all students.",
    });
  };

  const handleResetQuiz = async () => {
    await resetQuiz();
    toast({
      title: "Quiz reset",
      description: "The quiz and leaderboard have been reset successfully.",
    });
  };

  const handleUserManagement = () => {
    navigate("/superadmin/users");
  };

  const handleSystemSettings = () => {
    toast({
      title: "System Settings",
      description: "This feature will be implemented in a future update.",
    });
  };

  const handleViewLoginActivity = () => {
    toast({
      title: "Login Activity",
      description: "This feature will be implemented in a future update.",
    });
  };

  // Calculate stats
  const activeStudents = users ? users.filter(u => u.role === 'student').length : 0;
  const activeAdmins = users ? users.filter(u => u.role === 'admin').length : 0;
  const serverStatus = "Online"; // In a real app, this would be determined dynamically
  const lastBackup = new Date().toLocaleString(); // In a real app, this would be fetched from the server

  if (!user) return null;

  return (

    <div className="relative min-h-[78vh] flex items-center justify-center px-4 overflow-hidden">
      <video
      src="/images/bg_video2.mp4"
      autoPlay
      loop
      muted
      className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover"
      />

      <motion.div 
      className="relative z-10 flex flex-col p-4 bg-none bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      >
      
      
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-green-600 mb-6 text-center">Super Admin Panel</h1><br/>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 bg-white bg-opacity-90 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quiz Control</h2>
          <div className="space-y-3">
            <Button 
            className="w-full"
            onClick={handleStartQuiz}
            disabled={quizState !== 'waiting' || loading}
            >
            <Play className="h-4 w-4 mr-2" />
            Start Quiz
            </Button>
            
            <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
              variant="outline" 
              className="w-full border-red-500 text-red-500 hover:bg-red-50"
              >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Quiz & Leaderboard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Reset Quiz and Leaderboard</AlertDialogTitle>
              <AlertDialogDescription>
                This action will reset the quiz state, clear all students' answers, and reset the leaderboard. 
                This operation cannot be undone.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleResetQuiz}
                className="bg-red-600 hover:bg-red-700"
              >
                Reset Everything
              </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
          </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 bg-white bg-opacity-90 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">System Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
            <span className="text-gray-600">Active students:</span>
            <span className="font-medium">{activeStudents}</span>
            </div>
            <div className="flex justify-between">
            <span className="text-gray-600">Active admins:</span>
            <span className="font-medium">{activeAdmins}</span>
            </div>
            <div className="flex justify-between">
            <span className="text-gray-600">Server status:</span>
            <span className="text-green-600 font-medium">{serverStatus}</span>
            </div>
            <div className="flex justify-between">
            <span className="text-gray-600">Last backup:</span>
            <span className="font-medium">{lastBackup}</span>
            </div>
          </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 bg-white bg-opacity-90 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Access</h2>
          <div className="space-y-3">
            <Button 
            variant="outline" 
            className="w-full"
            onClick={handleUserManagement}
            >
            <Users className="h-4 w-4 mr-2" />
            User Management
            </Button>
            {/* <Button 
            variant="outline" 
            className="w-full"
            onClick={handleSystemSettings}
            >
            <Settings className="h-4 w-4 mr-2" />
            System Settings
            </Button>
            <Button 
            variant="outline" 
            className="w-full"
            onClick={handleViewLoginActivity}
            >
            <ClipboardList className="h-4 w-4 mr-2" />
            View Login Activity
            </Button> */}
          </div>
          </CardContent>
        </Card>
        </div>
        
        <div className="flex justify-end mt-4 space-x-4">
        <Button 
          variant="outline" 
          onClick={() => navigate("/admin/questions")}
        >
          Manage Questions
        </Button>
        <Button 
          onClick={() => navigate("/leaderboard")}
        >
          View Leaderboard
        </Button>
        </div>
      </div>
      </motion.div>
    </div>

  );
}
