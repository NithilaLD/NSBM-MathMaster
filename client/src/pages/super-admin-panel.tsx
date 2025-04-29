import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SuperAdminTabs from "@/components/super-admin/super-admin-tabs";
import UserManagement from "@/components/super-admin/user-management";
import QuizControls from "@/components/super-admin/quiz-controls";
import LoginActivity from "@/components/super-admin/login-activity";
import SystemSettings from "@/components/super-admin/system-settings";
import StatsCard from "@/components/super-admin/stats-card";

// Tab types for super admin panel
export type SuperAdminTab = "users" | "quiz" | "activity" | "settings";

export default function SuperAdminPanel() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SuperAdminTab>("users");

  // Redirect if not authenticated or not a super admin
  useEffect(() => {
    if (!user) {
      setLocation("/");
    } else if (user.role !== "superadmin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Fetch quiz status
  const { data: quizStatus, isLoading: isLoadingQuizStatus } = useQuery({
    queryKey: ["/api/quiz/status"],
  });

  // Fetch quiz results
  const { data: quizResults = [], isLoading: isLoadingQuizResults } = useQuery({
    queryKey: ["/api/quiz/results"],
  });

  // Mutation for starting the quiz
  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quiz/start", { active: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz/status"] });
      toast({
        title: "Quiz Started",
        description: "The quiz has been started for all students",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start quiz",
        variant: "destructive",
      });
    },
  });

  // Mutation for resetting the quiz
  const resetQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quiz/reset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz/results"] });
      toast({
        title: "Quiz Reset",
        description: "The quiz has been reset and all results cleared",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset quiz",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    logout();
  };

  const handleStartQuiz = () => {
    startQuizMutation.mutate();
  };

  const handleResetQuiz = () => {
    resetQuizMutation.mutate();
  };

  if (!user) {
    return null; // Loading or redirecting
  }

  // Calculate statistics
  const students = users.filter((u: any) => u.role === "student");
  const schools = [...new Set(students.map((s: any) => s.school))].filter(Boolean).length;
  
  const activeUsers = quizStatus?.active 
    ? students.filter((s: any) => s.status === "active").length 
    : 0;
  
  const completionRate = quizResults.length > 0 && students.length > 0
    ? Math.round((quizResults.length / students.length) * 100)
    : 0;

  return (

    
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="mr-4 text-primary-600 hover:text-primary-800 p-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-primary-800">Super Admin Dashboard</h1>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleResetQuiz}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
            disabled={resetQuizMutation.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reset Quiz
          </Button>
          <Button
            onClick={handleStartQuiz}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
            disabled={startQuizMutation.isPending}
          >
            <Play className="mr-2 h-4 w-4" /> Start Quiz
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Students"
          value={students.length.toString()}
          subtext={`From ${schools} different schools`}
          icon="user-graduate"
          color="blue"
          isLoading={isLoadingUsers}
        />
        
        <StatsCard
          title="Quiz Progress"
          value={`${completionRate}%`}
          subtext="Average completion rate"
          icon="tasks"
          color="green"
          isLoading={isLoadingQuizResults}
        />
        
        <StatsCard
          title="Active Users"
          value={activeUsers.toString()}
          subtext="Currently online"
          icon="users"
          color="red"
          isLoading={isLoadingQuizStatus}
        />
      </div>

      <Card className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Super Admin Tabs */}
        <SuperAdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* User Management Tab Content */}
        {activeTab === "users" && (
          <div className="p-6">
            <UserManagement users={users} isLoading={isLoadingUsers} />
          </div>
        )}

        {/* Quiz Controls Tab Content */}
        {activeTab === "quiz" && (
          <div className="p-6">
            <QuizControls 
              quizStatus={quizStatus} 
              isLoading={isLoadingQuizStatus} 
              onStartQuiz={handleStartQuiz}
              onResetQuiz={handleResetQuiz}
            />
          </div>
        )}

        {/* Login Activity Tab Content */}
        {activeTab === "activity" && (
          <div className="p-6">
            <LoginActivity users={users} isLoading={isLoadingUsers} />
          </div>
        )}

        {/* System Settings Tab Content */}
        {activeTab === "settings" && (
          <div className="p-6">
            <SystemSettings />
          </div>
        )}
      </Card>
    </div>
  );
}
