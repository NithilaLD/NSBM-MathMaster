import { useState } from "react";
import { Question } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuestionListProps {
  questions: Question[];
  isLoading: boolean;
  onEdit?: (question: Question) => void;
  onAddNew?: () => void;
}

export default function QuestionList({ questions, isLoading, onEdit, onAddNew }: QuestionListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const itemsPerPage = 10;
  
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
  
  const handleEditQuestion = (question: Question) => {
    if (onEdit) onEdit(question);
  };
  
  const handleDeleteQuestion = (questionId: number) => {
    setQuestionToDelete(questionId);
  };
  
  const confirmDelete = () => {
    if (questionToDelete) {
      deleteQuestionMutation.mutate(questionToDelete);
    }
  };
  
  const totalPages = Math.ceil(questions.length / itemsPerPage);
  const paginatedQuestions = questions.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  
  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">#</TableHead>
              <TableHead>Question</TableHead>
              <TableHead className="w-[100px]">Correct Answer</TableHead>
              <TableHead className="w-[100px]">Difficulty</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading questions...
                </TableCell>
              </TableRow>
            ) : paginatedQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No questions found. Add some questions to get started!
                </TableCell>
              </TableRow>
            ) : (
              paginatedQuestions.map((question, index) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">
                    {(page - 1) * itemsPerPage + index + 1}
                  </TableCell>

                  <TableCell>
                    {question.isImage ? (
                      <div className="flex flex-col space-y-2">
                        <img 
                          src={`/uploads/${question.questionImage}`} 
                          alt="Question" 
                          className="max-h-20 object-contain"
                        />
                        {question.questionText && (
                          <p className="text-sm text-gray-600">{question.questionText}</p>
                        )}
                      </div>
                    ) : (
                      question.questionText
                    )}
                  </TableCell>
                  
                  <TableCell>{question.correctAnswer}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty || 'medium'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditQuestion(question)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
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
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i + 1}
                variant={page === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(i + 1)}
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
              Next
            </Button>
          </nav>
        </div>
      )}
      
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
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
    </div>
  );
}