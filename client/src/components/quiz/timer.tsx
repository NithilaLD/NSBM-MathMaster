import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface TimerProps {
  timeLeft: number;
  totalTime?: number;
}

export default function Timer({ timeLeft, totalTime = 60 }: TimerProps) {
  const [percentage, setPercentage] = useState(100);
  
  useEffect(() => {
    setPercentage((timeLeft / totalTime) * 100);
  }, [timeLeft, totalTime]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="mb-6">
      <Progress 
        value={percentage} 
        className="h-2 bg-gray-200 rounded-full overflow-hidden"
        indicatorClassName={`h-full ${timeLeft <= 10 ? 'bg-red-500' : 'bg-primary-600'} transition-all duration-1000`}
      />
      <div className="flex justify-end mt-1">
        <span className="text-sm font-medium text-gray-600">{formatTime(timeLeft)}</span>
      </div>
    </div>
  );
}
