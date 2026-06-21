interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestion: number;
  userAnswers: Record<number, number>;
  flaggedQuestions: number[];
  onQuestionClick: (index: number) => void;
}

export default function QuestionNavigator({
  totalQuestions,
  currentQuestion,
  userAnswers,
  flaggedQuestions,
  onQuestionClick,
}: QuestionNavigatorProps) {
  
  // Calculate a sliding window of 5 buttons to show at a time
  const getVisiblePages = () => {
    let start = Math.max(0, currentQuestion - 2);
    let end = Math.min(totalQuestions - 1, start + 4);

    if (end - start < 4) {
      start = Math.max(0, end - 4);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex gap-2">
      {getVisiblePages().map((index) => {
        const isCurrent = currentQuestion === index;
        const isFlagged = flaggedQuestions.includes(index);
        const isAnswered = userAnswers[index] !== undefined;

        // Determine the premium gradient styling based on the state
        let styling = "bg-gradient-to-br from-slate-100 to-slate-300 shadow-md shadow-slate-700/30 text-slate-700 border-slate-300 hover:scale-110"; // Default
        
        if (isCurrent) {
          styling = "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30 text-white border-transparent scale-110 z-10 font-black hover:scale-110";
        } else if (isFlagged) {
          styling = "bg-gradient-to-br from-orange-400 to-red-600 shadow-md shadow-orange-500/30 text-white border-transparent hover:scale-110";
        } else if (isAnswered) {
          styling = "bg-gradient-to-br from-emerald-400 via-emerald-600 to-sky-950 shadow-md shadow-emerald-500/30 text-white border-transparent hover:scale-110";
        }

        return (
          <button
            key={index}
            onClick={() => onQuestionClick(index)}
            className={`w-10 h-10 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-semibold text-sm md:text-base transition-all duration-200 border  ${styling}`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}