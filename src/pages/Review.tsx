import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Review() {
  const navigate = useNavigate();
  const location = useLocation();

  // Safely extract all state, including the newly added timeLeft
  const {
    userAnswers = {},
    flaggedQuestions = [],
    questions = [],
    questionStats = {},
    timeLeft = 0, // Capture the remaining time
  } = location.state || {};

  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  // --- LIVE TIMER LOGIC ---
  const [liveTimeLeft, setLiveTimeLeft] = useState(timeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam(); // Auto-submit if time runs out while reviewing
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  // ------------------------
  
  // Format the LIVE time left for display
  const minutes = Math.floor(liveTimeLeft / 60);
  const seconds = liveTimeLeft % 60;

  const submitExam = () => {
    let score = 0;
    questions.forEach((question: any, index: number) => {
      if (userAnswers[index] === question.correctAnswer) {
        score++;
      }
    });

    navigate("/results", {
      state: {
        score,
        total: questions.length,
        flaggedCount: flaggedQuestions.length,
        timeTaken: (questions.length * 120) - Math.max(0, liveTimeLeft - 1),
        questionStats,
        userAnswers,
        questions,
      },
    });
  };

  // EXPLICITLY pass LIVE timeLeft back to the Exam page
  const goToQuestion = (questionIndex: number) => {
    navigate("/exam", {
      state: {
        returnToQuestion: questionIndex,
        userAnswers,
        flaggedQuestions,
        timeLeft: Math.max(0, liveTimeLeft - 1), // <- Pass the ticking time back!
      },
    });
  };

  const handleBackToExam = () => {
    navigate("/exam", {
      state: {
        returnToQuestion: 0, 
        userAnswers,
        flaggedQuestions,
        timeLeft: Math.max(0, liveTimeLeft - 1), // <- Pass the ticking time back!
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-sans text-slate-800 flex flex-col items-center">
      
      <div className="w-full max-w-4xl mt-4 md:mt-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 select-none">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 text-2xl pointer-events-none">
              📝
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Review Exam</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Check your answers before final submission</p>
            </div>
          </div>

          {/* Time Remaining Pill (Using Live Time) */}
          <div className="bg-gradient-to-r from-[#88eac2] to-[#5db391] text-white bg-red-50 text-red-500 border border-[#88eac2] px-5 py-2.5 rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(254,226,226,1)] flex items-center gap-2 pointer-events-none">
            ⏱️ Time Remaining: {minutes}:{seconds.toString().padStart(2, "0")}
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-8 md:p-10 select-none">
          
          <h2 className="text-lg font-bold text-slate-800 mb-6 cursor-default pointer-events-none">Question Map</h2>
          
          {/* QUESTION GRID */}
          <div className="flex flex-wrap gap-4">
            {questions.map((_: any, index: number) => {
              const isFlagged = flaggedQuestions.includes(index);
              const isAnswered = userAnswers[index] !== undefined;

              // Using your custom 3D gel styling!
              let styling = "bg-gradient-to-br from-slate-100 to-slate-300 shadow-md shadow-slate-400/30 text-slate-700 border-slate-300"; 
              
              if (isFlagged) {
                styling = "bg-gradient-to-br from-orange-400 to-red-600 shadow-md shadow-orange-500/30 text-white border-transparent";
              } else if (isAnswered) {
                styling = "bg-gradient-to-br from-emerald-400 via-emerald-600 to-sky-950 shadow-md shadow-emerald-500/30 text-white border-transparent";
              }

              return (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-12 h-12 md:w-11 md:h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95 border ${styling}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="mt-14 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            
            <button
              onClick={handleBackToExam}
              className="w-full md:w-auto bg-gradient-to-r from-indigo-400 to-violet-950 text-white px-8 py-3 rounded-2xl font-bold shadow-[0_4px_15px_rgba(79,70,229,0.4)] hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 hover:scale-105"
            >
              <span className="text-xl leading-none -mt-1">‹</span> Back To Exam
            </button>

            <button
              onClick={submitExam}
              className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-emerald-950 text-white px-8 py-3 rounded-2xl font-bold shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:brightness-110 transition-all active:scale-95 hover:scale-105"
            >
              Final Submit <span className="text-xl leading-none -mt-1">›</span> 
            </button>

          </div>

        </div>
        
        {/* STAT ROW / LEGEND */}
        <div className="bg-white rounded-full shadow-sm border border-slate-100 px-8 py-3 flex gap-8 mt-8 justify-center max-w-fit mx-auto text-sm font-semibold text-slate-600 select-none pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 shadow-md shadow-emerald-500/40 border border-emerald-200"></div> 
            Answered <span className="text-slate-900 font-black ml-1">{answeredCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 shadow-md shadow-orange-500/40 border border-orange-200"></div> 
            Flagged <span className="text-slate-900 font-black ml-1">{flaggedQuestions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 shadow-md shadow-slate-400/30 border border-slate-300"></div> 
            Unanswered <span className="text-slate-900 font-black ml-1">{unansweredCount}</span>
          </div>
        </div>

      </div>
    </div>
  );
}