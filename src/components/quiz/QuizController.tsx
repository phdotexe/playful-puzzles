import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause, XCircle } from "lucide-react";
import Timer from "./Timer";

interface QuizControllerProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  isAnswered: boolean;
  isPaused: boolean;
  timerEnabled: boolean;
  timeLimit: number;
  onTimeUp: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onPause: () => void;
  onQuit: () => void;
}

const QuizController = ({
  currentQuestionIndex,
  totalQuestions,
  isAnswered,
  isPaused,
  timerEnabled,
  timeLimit,
  onTimeUp,
  onNavigate,
  onPause,
  onQuit
}: QuizControllerProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="container mx-auto flex items-center justify-between">
        {/* Timer */}
        <div className="w-32">
          {timerEnabled && (
            <Timer
              timeLimit={timeLimit}
              isPaused={isPaused}
              onTimeUp={onTimeUp}
            />
          )}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => onNavigate('prev')}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate('next')}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Control buttons */}
        <div className="flex gap-2 w-32 justify-end">
          <Button
            variant="outline"
            onClick={onPause}
            className="flex items-center gap-2"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={onQuit}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            End Quiz
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizController;
