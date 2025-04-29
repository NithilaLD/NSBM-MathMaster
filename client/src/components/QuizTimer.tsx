
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface QuizTimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

export default function QuizTimer({
  initialSeconds,
  onTimeUp,
  isPaused = false,
}: QuizTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            if (interval) clearInterval(interval);
            onTimeUp();
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      onTimeUp();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds, onTimeUp, isPaused]);

  // Calculate percentage of time remaining
  const percentage = (seconds / initialSeconds) * 100;

  // Format time into HH:MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSeconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <div className="text-sm text-gray-500">Time Remaining</div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1 text-gray-400" />
          <motion.span
            key={seconds}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-sm font-semibold"
          >
            {formatTime(seconds)}
          </motion.span>
        </div>
      </div>
      <Progress
        value={percentage}
        className={`h-2.5 ${seconds <= 300 ? "animate-pulse" : ""}`}
        indicatorClassName={percentage < 25 ? "bg-red-500" : percentage < 50 ? "bg-yellow-500" : "bg-primary-600"}
      />
    </div>
  );
}
