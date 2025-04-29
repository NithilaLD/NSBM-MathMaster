import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Question } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, FileUp, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";

export default function Questions() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const itemsPerPage = 10;

  // Redirect to login if not authenticated or not an admin
  useEffect(() => {
    if (!user) {
      navigate("/");
    } else if (user.role !== "admin" && user.role !== "superadmin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ['/api/questions'],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/questions/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Question deleted",
        description: "The question has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setQuestionToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete question",
        description: error.message || "An error occurred while deleting the question.",
        variant: "destructive",
      });
    },
  });

  // Import questions from JSON
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(jsonData)) {
          throw new Error("Invalid JSON format: Expected an array of questions");
        }
        
        // Upload each question
        let successCount = 0;
        for (const item of jsonData) {
          try {
            await apiRequest("POST", "/api/questions", item);
            successCount++;
          } catch (error) {
            console.error("Failed to import question:", error);
          }
        }
        
        queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
        
        toast({
          title: "Questions imported",
          description: `Successfully imported ${successCount} out of ${jsonData.length} questions.`,
        });
      } catch (error) {
        toast({
          title: "Failed to import questions",
          description: "Please check that your JSON file is properly formatted.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleEditQuestion = (questionId: number) => {
    const question = questions?.find(q => q.id === questionId);
    if (question) {
      navigate(`/admin/add-question?edit=${questionId}`, { state: { question } });
    }
  };

  const handleDeleteQuestion = (questionId: number) => {
    setQuestionToDelete(questionId);
  };

  const confirmDelete = () => {
    if (questionToDelete) {
      deleteQuestionMutation.mutate(questionToDelete);
    }
  };

  const handleBack = () => {
    if (user?.role === 'superadmin') {
      navigate('/superadmin');
    } else {
      navigate('/admin');
    }
  };

  const totalPages = questions ? Math.ceil(questions.length / itemsPerPage) : 0;
  const paginatedQuestions = questions 
    ? questions.slice((page - 1) * itemsPerPage, page * itemsPerPage) 
    : [];

  if (!user) return null;

  return (
    <motion.div 
      className="min-h-screen flex flex-col p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-primary-600 hover:text-primary-800"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </Button>
        {/* <div>
          <span className="text-gray-700 font-medium">Admin:</span>
          <span className="text-primary-700 font-medium ml-1">{user.username}</span>
        </div> */}
      </div>
      
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Question List</h1>
          
          <div className="flex gap-2">
            <Button onClick={() => navigate("/admin/add-question")}>
              Add New Question
            </Button>
            {/* <div className="relative">
              <Input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
                id="json-upload"
              />
              <Button variant="outline" onClick={() => document.getElementById('json-upload')?.click()}>
                <FileUp className="h-4 w-4 mr-2" />
                Import JSON
              </Button>
            </div> */}
          </div>
        </div>
        
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Question</TableHead>
                    <TableHead className="w-[100px]">Correct Answer</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading questions...
                      </TableCell>
                    </TableRow>
                  ) : paginatedQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No questions found. Add some questions to get started!
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedQuestions.map((question: Question, index: number) => (
                      <TableRow key={question.id}>
                        <TableCell className="font-medium">
                          {(page - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell>{question.correctAnswer}</TableCell>
                        <TableCell className="text-right">
                          {/* <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditQuestion(question.id)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button> */}
                          <AlertDialog open={questionToDelete === question.id} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this question? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-l-md"
                  >
                    <span className="sr-only">Previous</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={page === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(i + 1)}
                      className="rounded-none"
                    >
                      {i + 1}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-r-md"
                  >
                    <span className="sr-only">Next</span>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </nav>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
