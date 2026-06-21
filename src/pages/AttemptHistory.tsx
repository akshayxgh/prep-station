import { useNavigate } from "react-router-dom";
import { getAttempts } from "../services/storage";

export default function AttemptHistory() {
  const navigate = useNavigate();
  
  // Fetch all attempts and reverse them so the newest is at the top
  const allAttempts = getAttempts().slice().reverse();

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-sans text-slate-800 flex flex-col items-center select-none">
      
      <div className="w-full max-w-4xl mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-slate-500 hover:text-indigo-600 transition font-bold text-sm flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 w-fit hover:shadow-md hover:-translate-x-1"
        >
          <span className="text-lg leading-none -mt-0.5">‹</span> Back to Dashboard
        </button>
      </div>

      <div className="w-full max-w-4xl bg-white border border-slate-200/60 rounded-[2rem] p-6 md:p-10 shadow-sm">
        
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Attempt History</h1>
          <p className="text-slate-500 font-semibold mt-2">
            You have completed {allAttempts.length} total {allAttempts.length === 1 ? "exam" : "exams"}.
          </p>
        </div>

        {allAttempts.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 font-semibold">
            <span className="text-4xl block mb-3 pointer-events-none">📭</span>
            No attempts found. Take a mock exam to see your history here!
          </div>
        ) : (
          <div className="space-y-4">
            {allAttempts.map((attempt, index) => {
              const isPass = attempt.percentage >= 70;
              const cardStyle = isPass 
                ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100" 
                : attempt.percentage >= 60 
                ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100" 
                : "bg-gradient-to-r from-red-50 to-rose-50 border-red-100";
              
              return (
                <div
                  key={index}
                  onClick={() => navigate("/attempt-detail", { state: { attempt } })}
                  className={`
                    group rounded-2xl p-6 transition-all duration-300 cursor-pointer border shadow-sm
                    hover:shadow-md hover:scale-[1.01] flex flex-col md:flex-row justify-between items-start md:items-center gap-4
                    ${cardStyle}
                  `}
                >
                  <div>
                    <p className="font-black text-lg md:text-xl text-slate-800 tracking-tight">
                      {new Date(attempt.date).toLocaleString("en-IN", {
                        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
                      })}
                    </p>
                    
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="bg-white/80 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest text-slate-600 uppercase shadow-sm">
                        Correct: <span className="text-slate-900">{attempt.score}/{attempt.total}</span>
                      </span>
                      <span className="bg-white/80 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest text-slate-600 uppercase shadow-sm">
                        Flagged: <span className="text-slate-900">{attempt.flaggedCount}</span>
                      </span>
                      <span className="bg-white/80 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest text-slate-600 uppercase shadow-sm">
                        Time: <span className="text-slate-900">{Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s</span>
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-sm ${isPass ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}>
                        {isPass ? "Passed" : "Retry"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto text-right mt-2 md:mt-0">
                    <p className={`text-5xl md:text-6xl font-black tracking-tighter group-hover:scale-110 transition-transform origin-right ${
                      attempt.percentage >= 70 ? "text-emerald-500" : attempt.percentage >= 60 ? "text-amber-500" : "text-red-500"
                    }`}>
                      {attempt.percentage}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}