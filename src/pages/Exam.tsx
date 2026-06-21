import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import QuestionNavigator from "../components/QuestionNavigator";
import allQuestions from "../data/questions.json";

// --- CUSTOM RANDOMIZATION LOGIC ---
const shuffleArray = (array: any[]) => [...array].sort(() => 0.5 - Math.random());

// This stays outside because it's just a helper function
const getBalancedRandomQuestions = (targetTotal: number, domainFilter: string | null = null) => {
  const allDomains = ["Prepare Data", "Model Data", "Visualize & Analyze", "Manage & Secure"];
  
  // If a filter is applied, only pull from that domain
  const domains = domainFilter ? [domainFilter] : allDomains;
  const selected: any[] = [];
  
  const basePerDomain = Math.floor(targetTotal / domains.length);
  let remainder = targetTotal % domains.length;

  domains.forEach((domain) => {
    const domainQs = allQuestions.filter((q) => q.domain === domain);
    const amountToTake = basePerDomain + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    selected.push(...shuffleArray(domainQs).slice(0, amountToTake));
  });

  return shuffleArray(selected).slice(0, targetTotal); // Added slice to ensure exact targetTotal
};

// ----------------------------------

export default function Exam() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. MOVED INSIDE: Safely extract the filter from the router state
  const domainFilter = location.state?.domainFilter ?? null;

  // 2. MOVED INSIDE: Initialize questions ONCE when the component loads
  const [questions] = useState(() => getBalancedRandomQuestions(10, domainFilter));

  const [currentQuestion, setCurrentQuestion] = useState(
    location.state?.returnToQuestion ?? 0
  );

  const [userAnswers, setUserAnswers] = useState<Record<number, number>>(
    location.state?.userAnswers ?? {}
  );

  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>(
    location.state?.flaggedQuestions ?? []
  );

  // Dynamic timer: 2 minutes (120 seconds) per question
  const TOTAL_EXAM_TIME = questions.length * 120;
  const [timeLeft, setTimeLeft] = useState(
    location.state?.timeLeft ?? TOTAL_EXAM_TIME
  );

  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});

  const submitExam = () => {
    navigate("/review", {
      state: {
        userAnswers,
        flaggedQuestions,
        questions,
        timeTaken: TOTAL_EXAM_TIME - timeLeft,
        questionStats: questionTimes,
        timeLeft: Math.max(0, timeLeft - 1),
      },
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      // FIX: Strictly typed 'prev' as number
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const questionTimer = setInterval(() => {
      setQuestionTimes((prev) => ({
        ...prev,
        [currentQuestion]: (prev[currentQuestion] || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(questionTimer);
  }, [currentQuestion]);

  const question = questions[currentQuestion];
  const selectedAnswer = userAnswers[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredCount = Object.keys(userAnswers).length;

  const handleAnswerSelect = (index: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion]: index,
    }));
  };

  const toggleFlag = () => {
    if (flaggedQuestions.includes(currentQuestion)) {
      setFlaggedQuestions(flaggedQuestions.filter((q) => q !== currentQuestion));
    } else {
      setFlaggedQuestions([...flaggedQuestions, currentQuestion]);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-sans text-slate-800 flex flex-col items-center select-none">
      
      <div className="w-full max-w-6xl">
        
        {/* COMBINED HEADER & STATS ROW */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          
          {/* LEFT SIDE: Logo, Title, and Stats */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 text-xl md:text-2xl pointer-events-none">
                🎓
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">Mock Exam</h1>
                <button onClick={toggleFlag} className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 mt-0.5 transition-colors">
                  {flaggedQuestions.includes(currentQuestion) ? "🚩 Flagged" : "⚑ Flag For Review"}
                </button>
              </div>
            </div>

            {/* Vertical Divider (Hidden on mobile) */}
            <div className="hidden lg:block w-px h-8 bg-slate-200"></div>

            {/* Stats Pills */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm font-semibold text-slate-600">
              <div className="bg-gradient-to-r from-[#a1dfa3] to-[#5db761] text-white bg-white px-4 py-2.5 rounded-2xl border border-[#9cdc9f] shadow-sm flex items-center gap-2">
                <span className="text-emerald-500 text-base leading-none pointer-events-none">✓</span> 
                Answered: <span className=" font-bold">{answeredCount}</span>
              </div>
              
              <div className="bg-gradient-to-r from-[#ff8964] to-[#e55327] text-white bg-white px-4 py-2.5 rounded-2xl border border-[#ff8964] shadow-sm flex items-center gap-2" >
                <span className="text-[#993c54] text-base leading-none pointer-events-none">⚑</span> 
                Flagged: <span className="text-slate-900 font-bold">{flaggedQuestions.length}</span>
              </div>
              
              <div className="bg-gradient-to-r from-[#93776c] to-[#593f35] text-white bg-white px-4 py-2.5 rounded-2xl border border-[#93776c] shadow-sm flex items-center gap-2 text-indigo-600">
                <span className="text-base leading-none pointer-events-none">📋</span> 
                Question {currentQuestion + 1} <span className=" font-normal">of {questions.length}</span>
              </div>

              {/* NEW: CONDITIONAL DOMAIN FOCUS CARD */}
              {domainFilter && (
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 border border-indigo-400">
                  <span className="text-base leading-none pointer-events-none">🎯</span> 
                  Focus: <span className="font-bold">{domainFilter}</span>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDE: Quit & Timer */}
          <div className="flex items-center gap-3 lg:ml-auto">
            <button 
              onClick={() => navigate("/")} 
              className="bg-gradient-to-r from-[#b25b5b] to-[#e33c3c] text-white bg-white text-slate-500 hover:text-[#000000] border border-[#e5cdcd] px-5 py-2.5 rounded-2xl font-bold text-sm shadow-sm transition hover:scale-105"
            >
              Quit Exam
            </button>
            <div className="bg-gradient-to-r from-[#88eac2] to-[#5db391] text-white bg-red-50 text-red-500 border border-[#88eac2] px-5 py-2.5 rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(254,226,226,1)] flex items-center gap-2 pointer-events-none">
              ⏱️ Time Left: {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
          </div>

        </div>

        {/* MAIN EXAM CARD */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-6 md:p-10">
          
          {/* PROGRESS BAR */}
          <div className="mb-8">
            <div className="flex justify-between text-sm font-bold text-slate-500 mb-3 pointer-events-none">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span className="text-indigo-700">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>

          {/* QUESTION TEXT */}
          <h2 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed mb-8 select-none">
            {question.question}
          </h2>

          {/* OPTIONS */}
          <div className="space-y-4">
            {question.options.map((option: string, index: number) => {
              const isSelected = selectedAnswer === index;
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left flex items-center gap-4 p-4 md:p-5 rounded-2xl transition-all duration-200 border ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent shadow-[0_4px_20px_rgba(99,102,241,0.3)] text-white hover:scale-[1.01]"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:scale-[1.01]"
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-2xl flex items-center justify-center font-bold text-sm border-2 transition-colors pointer-events-none ${
                    isSelected
                      ? "border-white/50 text-white bg-white/20"
                      : "border-slate-300 text-slate-400 bg-white"
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  
                  <span className={`text-base md:text-[17px] font-medium leading-snug select-none ${isSelected ? "text-white" : "text-slate-700"}`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* NAVIGATION FOOTER */}
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
            
            <button
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
              className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-[0_4px_15px_rgba(79,70,229,0.4)] hover:brightness-110 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-2 hover:scale-105"
            >
              <span className="text-xl leading-none -mt-1 pointer-events-none">‹</span> Previous
            </button>

            <div className="scale-100 md:scale-110">
              <QuestionNavigator
                totalQuestions={questions.length}
                currentQuestion={currentQuestion}
                userAnswers={userAnswers}
                flaggedQuestions={flaggedQuestions}
                onQuestionClick={setCurrentQuestion}
              />
            </div>

            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={submitExam}
                className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-emerald-950 text-white px-8 py-3 rounded-2xl font-bold shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:brightness-110 transition-all active:scale-95 hover:scale-105"
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-[0_4px_15px_rgba(79,70,229,0.4)] hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 hover:scale-105"
              >
                Next <span className="text-xl leading-none -mt-1 pointer-events-none">›</span>
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM LEGEND PILL */}
        <div className="bg-white rounded-full shadow-sm border border-slate-100 px-8 py-3 flex gap-8 mt-8 justify-center max-w-fit mx-auto text-sm font-semibold text-slate-600 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 shadow-md shadow-emerald-500/40 border border-emerald-200"></div> Answered
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 shadow-md shadow-orange-500/40 border border-orange-200"></div> Flagged
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 shadow-md shadow-indigo-500/40 border border-indigo-200"></div> Current
          </div>
        </div>

      </div>
    </div>
  );
}