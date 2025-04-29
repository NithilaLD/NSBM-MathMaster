import { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Question } from "@shared/schema";

interface QuestionsListProps {
  questions: Question[];
  onEdit: (questionId: number) => void;
}

export default function QuestionsList({ questions, onEdit }: QuestionsListProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/questions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question deleted successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
    setDeleteId(null);
  };
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Question</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead className="w-[100px]">Difficulty</TableHead>
            <TableHead className="w-[100px]">Answer</TableHead>
            <TableHead className="w-[120px] text-right">Preview</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => (
            <TableRow key={question.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">Q{question.id}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  {question.questionText && (
                    <p className="text-sm text-gray-900 line-clamp-2">{question.questionText}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={question.isImage ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                  {question.isImage ? 'Image' : 'Text'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={
                  question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {question.difficulty}
                </Badge>
              </TableCell>
              <TableCell>{question.correctAnswer}</TableCell>
              <TableCell className="text-right">
                {question.isImage && question.questionImage && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Question Preview</AlertDialogTitle>
                      </AlertDialogHeader>
                      <div className="mt-4">
                        <img 
                          src={`/uploads/${question.questionImage}`} 
                          alt="Question Preview"
                          className="w-full h-auto max-h-[500px] object-contain rounded-lg"
                        />
                        {question.questionText && (
                          <p className="mt-4 text-gray-700">{question.questionText}</p>
                        )}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(question.id)}
                  className="text-primary-600 hover:text-primary-900 mr-3"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <AlertDialog open={deleteId === question.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(question.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the question.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(question.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
