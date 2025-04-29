import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useQuiz } from "@/context/QuizContext";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";



export default function WaitingRoom() {
  const { user } = useAuth();
  const { quizState } = useQuiz();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/");
    } else if (user.role !== "student") {
      // Admins and super admins don't need to wait
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "superadmin") {
        navigate("/superadmin");
      }
    }
  }, [user, navigate]);

  // Redirect to quiz if quiz has started
  useEffect(() => {
    if (quizState === "started") {
      navigate("/quiz");
    }
  }, [quizState, navigate]);

  const handleBack = () => {
    navigate("/rules");
  };

  if (!user) return null;

  return (
    
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 z-0">
      <video
        src="/images/bg_video2.mp4"
        autoPlay
        loop
        muted
        className="w-full h-full object-cover"
      />
      </div>

      <motion.div 
      className="relative z-10 min-h-screen flex flex-col p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      >
      <div className="flex items-center mb-6">
        <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center text-primary-600 hover:text-primary-800"
        onClick={handleBack}
        >
        <ArrowLeft className="h-5 w-5 mr-1" />
        Back
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div 
        className="max-w-md w-full"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        >
        <Card>
          <CardContent className="p-8 text-center">
          <div className="relative mb-8 w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
            <Clock className="h-10 w-10 text-primary-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Waiting for Admin</h2>
          <p className="text-gray-600 mb-6">
            Please wait while the administrator starts the quiz. The quiz will begin automatically once it's initiated.
          </p>
          
          <div className="p-4 bg-primary-50 rounded-lg mb-4">
            <p className="text-primary-700 font-medium">
            Stay on this screen to be automatically redirected when the quiz begins.
            </p>
          </div>

            <div className="p-4 bg-primary-50 rounded-lg mb-4">
              <p className="text-primary-700 font-medium text-lg text-red-500">
            If you you get blank page please refresh the page
              </p>
            </div>

          <Button
            onClick={() => {
            // Force refetch quiz settings without page reload
            queryClient.invalidateQueries({ queryKey: ['/api/quiz/settings'] });
            toast({
              title: "Refreshing status",
              description: "Checking for quiz start...",
            });
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
          </CardContent>
        </Card>
        </motion.div>
      </div>
      </motion.div>
    </div>
  );

  
}
