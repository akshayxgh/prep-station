import { useNavigate } from "react-router-dom";
import { getAttempts } from "../services/storage";

export default function Home() {
  const navigate = useNavigate();
  const attempts = getAttempts();

  const examsTaken = attempts.length;

  const bestScore =
    attempts.length > 0
      ? Math.max(...attempts.map((attempt) => attempt.percentage))
      : 0;

  const averageScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) /
            attempts.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden select-none font-sans text-slate-800">
      
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl">
        
        {/* HERO SECTION */}
        <div className="text-center mb-16 group cursor-default">
          {/* Hero Icon with continuous float & massive spin on hover */}
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] mx-auto shadow-lg shadow-indigo-500/30 flex items-center justify-center text-4xl md:text-5xl text-white mb-8 pointer-events-none transform -rotate-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
            🏆
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 text-slate-900 drop-shadow-sm">
            PL-300 Coach
          </h1>
          
          {/* Animated Subtitle Icons */}
          <div className="flex items-center justify-center gap-4 text-sm md:text-lg font-bold text-slate-500 tracking-wide uppercase">
            <span className="flex items-center gap-2 group-hover:-translate-y-1 transition-transform duration-300 delay-75">
              📚 Train
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-2 group-hover:-translate-y-1 transition-transform duration-300 delay-150">
              ⚖️ Analyze
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-2 group-hover:-translate-y-1 transition-transform duration-300 delay-200">
              ✅ Pass
            </span>
          </div>
        </div>

        {/* MODERN ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6 mb-20">
          
          <button
            onClick={() => navigate("/exam")}
            className="group w-full md:w-auto bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-10 py-4 md:py-5 rounded-2xl font-black tracking-tight shadow-[0_4px_15px_rgba(99,102,241,0.4)] hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-3 hover:scale-[1.02] text-lg md:text-xl"
          >
            <span className="text-2xl group-hover:translate-x-3 group-hover:-translate-y-3 group-hover:rotate-12 transition-all duration-300">
              🚀
            </span>
            Start Mock Exam
          </button>

          <button
            onClick={() => navigate("/training")}
            className="group w-full md:w-auto bg-gradient-to-br from-purple-600 to-[#da4453] border-2 border-indigo-100 text-white px-10 py-4 md:py-5 rounded-2xl font-black tracking-tight shadow-sm hover:border-indigo-400 hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-3 hover:scale-[1.02] text-lg md:text-xl"
          >
            <span className="text-2xl group-hover:-translate-x-2 transition-transform group-hover:scale-155 transition-all duration-300 scale-150">
              🏎️
            </span>
            Start Topic Trainer
          </button>
          
          <button
            onClick={() => navigate("/dashboard")}
            className="group w-full md:w-auto bg-gradient-to-br from-[#da4453] to-[#89216b] border-2 border-[#da4453] text-white px-10 py-4 md:py-5 rounded-2xl font-black tracking-tight shadow-sm hover:border-blue-300 hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-3 hover:scale-[1.02] text-lg md:text-xl"
          >
            <span className="text-2xl group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-300">
              📊
            </span>
            View Dashboard
          </button>

        </div>

        {/* ELEVATED KPI CARDS WITH WATERMARK ANIMATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-slate-200/80 hover:shadow-lg transition-all hover:-translate-y-1 text-center group cursor-default relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
              🎯
            </div>
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 relative z-10">Readiness Score</p>
            <p className="text-6xl font-black tracking-tighter text-indigo-600 group-hover:scale-105 transition-transform relative z-10">
              {averageScore}%
            </p>
          </div>
          
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-slate-200/80 hover:shadow-lg transition-all hover:-translate-y-1 text-center group cursor-default relative overflow-hidden">
            <div className="absolute -left-4 -bottom-4 text-8xl opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 pointer-events-none">
              📝
            </div>
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 relative z-10">Exams Taken</p>
            <p className="text-6xl font-black tracking-tighter text-blue-600 group-hover:scale-105 transition-transform relative z-10">
              {examsTaken}
            </p>
          </div>
          
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-slate-200/80 hover:shadow-lg transition-all hover:-translate-y-1 text-center group cursor-default relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
              ⭐
            </div>
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 relative z-10">Best Score</p>
            <p className="text-6xl font-black tracking-tighter text-emerald-500 group-hover:scale-105 transition-transform relative z-10">
              {bestScore}%
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}