
import React from 'react';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Strikethrough } from "lucide-react";

interface QuizOptionProps {
  option: React.ReactNode;
  selected: boolean;
  correct?: boolean;
  onClick: () => void;
  disabled?: boolean;
  questionId?: number | string; // Add questionId to track which question this option belongs to
  optionIndex: number; // Add optionIndex to identify which option this is
  onStrikethrough?: (questionId: number | string, optionIndex: number, isStriked: boolean) => void; // Callback for strikethrough
  isStrikedOut?: boolean; // Control strikethrough from parent
}

const QuizOption = ({ 
  option, 
  selected, 
  correct, 
  onClick, 
  disabled, 
  questionId,
  optionIndex,
  onStrikethrough,
  isStrikedOut = false
}: QuizOptionProps) => {
  const handleStrikethrough = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    if (!disabled && onStrikethrough && questionId !== undefined) {
      onStrikethrough(questionId, optionIndex, !isStrikedOut);
    }
  };

  return (
    <div className="flex items-center gap-3 my-2">
      <div 
        onClick={handleStrikethrough}
        className={cn(
          "text-gray-400 hover:text-error dark:text-gray-500 dark:hover:text-error/80 cursor-pointer",
          isStrikedOut && "text-error dark:text-error/80",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <Strikethrough className="w-4 h-4" />
      </div>
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={onClick}
        className={cn(
          "w-5 h-5 border rounded flex items-center justify-center cursor-pointer flex-shrink-0",
          !selected && "border-gray-300 dark:border-gray-600",
          selected && correct === undefined && "bg-primary border-primary",
          selected && correct === true && "bg-success border-success",
          selected && correct === false && "bg-error border-error",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </motion.div>
      <span 
        className={cn(
          "flex-1",
          "text-card-foreground dark:text-card-foreground", // Using card-foreground to match question color
          isStrikedOut && "line-through text-gray-500 dark:text-gray-400"
        )}
      >
        {option}
      </span>
    </div>
  );
};

export default QuizOption;
