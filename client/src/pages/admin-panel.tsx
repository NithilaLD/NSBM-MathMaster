import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileImport, Play, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import QuestionForm from "@/components/admin/question-form";
import QuestionsList from "@/components/admin/questions-list";
import AdminTabs from "@/components/admin/admin-tabs";
import StudentsList from "@/components/admin/students-list";
import ProgressMonitor from "@/components/admin/progress-monitor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Tab types for admin panel
export type AdminTab = "questions" | "students" | "progress";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("questions");
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!user) {
      setLocation("/");
    } else if (user.role !== "admin" && user.role !== "superadmin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Fetch questions
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["/api/questions"],
  });

  // Fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
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

  const handleBack = () => {
    logout();
  };

  const handleStartQuiz = () => {
    startQuizMutation.mutate();
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingQuestion(null);
  };

  if (!user) {
    return null; // Loading or redirecting
  }

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
          <h1 className="text-2xl font-bold text-primary-800">Admin Panel</h1>
        </div>
        <Button
          onClick={handleStartQuiz}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
          disabled={startQuizMutation.isPending}
        >
          <Play className="mr-2 h-4 w-4" /> Start Quiz
        </Button>
      </div>

      <Card className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Admin Tabs */}
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Questions Tab Content */}
        {activeTab === "questions" && (
          <div className="p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Mathematics Questions</h2>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  className="bg-primary-100 hover:bg-primary-200 text-primary-800 font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
                >
                  <FileImport className="mr-2 h-4 w-4" /> Import Questions
                </Button>
                <Button
                  onClick={handleAddQuestion}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Question
                </Button>
              </div>
            </div>

            {/* Question Form in Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? "Edit Question" : "Add New Question"}
                  </DialogTitle>
                </DialogHeader>
                <QuestionForm
                  initialData={editingQuestion}
                  questionId={editingQuestion?.id}
                  onSuccess={handleFormClose}
                />
              </DialogContent>
            </Dialog>

            {/* Questions List */}
            {isLoadingQuestions ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading questions...</p>
              </div>
            ) : (
              <QuestionsList
                questions={questions}
                onEdit={handleEditQuestion}
              />
            )}
          </div>
        )}

        {/* Students Tab Content */}
        {activeTab === "students" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Registered Students</h2>
            {isLoadingStudents ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading students...</p>
              </div>
            ) : (
              <StudentsList students={students} />
            )}
          </div>
        )}

        {/* Progress Tab Content */}
        {activeTab === "progress" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Quiz Progress</h2>
            <ProgressMonitor />
          </div>
        )}
      </Card>
    </div>
  );
}
