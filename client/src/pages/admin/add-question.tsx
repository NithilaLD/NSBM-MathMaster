import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQuestionSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  questionImage: z
    .any()
    .refine((file) => file instanceof File || file === null, {
      message: "Question image must be a file",
    }),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctAnswer: z.enum(["A", "B", "C", "D"], {
    required_error: "Please select the correct answer",
  }),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export default function AddQuestion() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editQuestion = location.state?.question;

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      navigate("/");
    }
  }, [user, navigate]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: editQuestion ? {
      questionImage: null,
      optionA: editQuestion.optionA,
      optionB: editQuestion.optionB,
      optionC: editQuestion.optionC,
      optionD: editQuestion.optionD,
      correctAnswer: editQuestion.correctAnswer,
      difficulty: editQuestion.difficulty || "medium"
    } : {
      questionImage: null,
      optionA: "A",
      optionB: "B",
      optionC: "C",
      optionD: "D",
      correctAnswer: undefined,
      difficulty: "medium"
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/questions", data);
    },
    onSuccess: () => {
      toast({
        title: "Question added",
        description: "The question has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      navigate("/admin/questions");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add question",
        description: error.message || "An error occurred while adding the question.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const formData = new FormData();

    if (data.questionImage instanceof File) {
      formData.append("questionImage", data.questionImage);
      formData.append("isImage", "true");
    }

    formData.append("optionA", data.optionA);
    formData.append("optionB", data.optionB);
    formData.append("optionC", data.optionC);
    formData.append("optionD", data.optionD);
    formData.append("correctAnswer", data.correctAnswer);
    formData.append("difficulty", data.difficulty);

    addQuestionMutation.mutate(formData);
  };

  const handleBack = () => {
    if(user.role==='superadmin'){navigate("/superadmin");}
    else{navigate("/admin");}
  };

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
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {editQuestion ? "Edit Question" : "Add New Question"}
            </h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => {console.error("Form Errors:", errors);})} className="space-y-6">
                <FormField
                  control={form.control}
                  name="questionImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Image</FormLabel>
                      <FormControl>
                        <>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.onChange(file);
                              }
                            }}
                          />
                          {editQuestion && !field.value && (
                            <img
                              src={`/uploads/${editQuestion.questionText}`}
                              alt="Current Question"
                              className="mt-4 max-h-48 rounded-lg border border-gray-300"
                            />
                          )}
                          {field.value && typeof field.value === "object" && (
                            <img
                              src={URL.createObjectURL(field.value)}
                              alt="Image Preview"
                              className="mt-4 max-h-48 rounded-lg border border-gray-300"
                            />
                          )}
                        </>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
                  <FormField
                    control={form.control}
                    name="optionA"
                    render={({ field }) => (
                      <FormItem >
                        <FormLabel>Option A</FormLabel>
                        <FormControl>
                          <Input {...field} value="A" readOnly/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="optionB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option B</FormLabel>
                        <FormControl>
                          <Input {...field} value="B" readOnly/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="optionC"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option C</FormLabel>
                        <FormControl>
                          <Input {...field} value="C" readOnly/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="optionD"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option D</FormLabel>
                        <FormControl>
                          <Input {...field} value="D" readOnly/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="A" id="r1" />
                            <label htmlFor="r1">A</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="B" id="r2" />
                            <label htmlFor="r2">B</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="C" id="r3" />
                            <label htmlFor="r3">C</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="D" id="r4" />
                            <label htmlFor="r4">D</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={addQuestionMutation.isPending}
                  >
                    {addQuestionMutation.isPending ? "Adding..." : "Add Question"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}