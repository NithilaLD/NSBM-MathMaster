import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";

export default function ProgressMonitor() {
  // Fetch quiz status
  const { data: quizStatus, isLoading: isLoadingQuizStatus } = useQuery({
    queryKey: ["/api/quiz/status"],
  });
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
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
  
  // Fetch quiz results
  const { data: quizResults = [], isLoading: isLoadingQuizResults } = useQuery({
    queryKey: ["/api/quiz/results"],
  });
  
  if (isLoadingQuizStatus || isLoadingUsers || isLoadingQuizResults) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading quiz progress data...</p>
      </div>
    );
  }
  
  const isQuizActive = quizStatus?.active || false;
  const totalStudents = users.filter((u: any) => u.role === 'student').length;
  const completedQuizzes = quizResults.length;
  const inProgressQuizzes = isQuizActive ? totalStudents - completedQuizzes : 0;
  const notStartedQuizzes = isQuizActive ? 0 : totalStudents - completedQuizzes;
  
  const completionRate = totalStudents > 0 ? Math.round((completedQuizzes / totalStudents) * 100) : 0;
  
  // Data for pie chart
  const statusData = [
    { name: 'Completed', value: completedQuizzes, color: '#3B82F6' },
    { name: 'In Progress', value: inProgressQuizzes, color: '#F59E0B' },
    { name: 'Not Started', value: notStartedQuizzes, color: '#D1D5DB' }
  ];
  
  // Calculate average score
  const scores = quizResults.map((result: any) => result.score);
  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) 
    : 0;
  
  // Distribute scores into categories
  const scoreDistribution = {
    excellent: scores.filter((s: number) => s >= 40).length,
    good: scores.filter((s: number) => s >= 30 && s < 40).length,
    average: scores.filter((s: number) => s >= 20 && s < 30).length,
    poor: scores.filter((s: number) => s < 20).length
  };
  
  // Data for score distribution chart
  const scoreData = [
    { name: 'Excellent (40-50)', value: scoreDistribution.excellent, color: '#10B981' },
    { name: 'Good (30-39)', value: scoreDistribution.good, color: '#3B82F6' },
    { name: 'Average (20-29)', value: scoreDistribution.average, color: '#F59E0B' },
    { name: 'Poor (0-19)', value: scoreDistribution.poor, color: '#EF4444' }
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quiz Completion Status</h3>
          
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Overall Completion</span>
              <span className="text-sm font-medium text-primary-600">{completionRate}%</span>
            </div>
            <Progress 
              value={completionRate} 
              className="h-2 bg-gray-200 rounded-full"
              indicatorClassName="h-full bg-primary-500 rounded-full"
            />
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-center mt-4">
            <div className="text-sm text-gray-600">
              {completedQuizzes} out of {totalStudents} students completed the quiz
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Distribution</h3>
          
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Average Score</span>
              <span className="text-sm font-medium text-primary-600">{averageScore}/50</span>
            </div>
            <Progress 
              value={(averageScore / 50) * 100} 
              className="h-2 bg-gray-200 rounded-full"
              indicatorClassName="h-full bg-primary-500 rounded-full"
            />
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {scoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-center mt-4">
            <div className="text-sm text-gray-600">
              Based on {completedQuizzes} completed quizzes
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quiz Status</h3>
        
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className={`text-2xl font-bold ${isQuizActive ? 'text-green-600' : 'text-gray-600'}`}>
              {isQuizActive ? 'Quiz is Active' : 'Quiz is Inactive'}
            </div>
            <p className="mt-2 text-gray-600">
              {isQuizActive 
                ? 'Students can now access the quiz questions.' 
                : 'Students are currently in the waiting room.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
