import { useNavigate } from "react-router-dom";
import { getAttempts } from "../services/storage";
import questions from "../data/questions.json";

export default function Dashboard() {
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
          attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length
        )
      : 0;

  const passedAttempts = attempts.filter((attempt) => attempt.percentage >= 70).length;

  const passRate =
    examsTaken > 0 ? Math.round((passedAttempts / examsTaken) * 100) : 0;

  const domains = [
    "Prepare Data",
    "Model Data",
    "Visualize & Analyze",
    "Manage & Secure",
  ] as const;

  // --- DERIVED ANALYTICS ---

  // 1. Total Time Spent Studying
  const totalSeconds = attempts.reduce((sum, att) => sum + (att.timeTaken || 0), 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalRemainingMins = Math.floor((totalSeconds % 3600) / 60);

  // 2. Average Time Per Question Across All Exams
  const totalQuestionsAttempted = attempts.reduce((sum, att) => sum + Object.keys(att.userAnswers || {}).length, 0);
  const globalAvgTimePerQuestion = totalQuestionsAttempted > 0 ? Math.round(totalSeconds / totalQuestionsAttempted) : 0;

  // 3. Weakest Domain for AI Coach Insight (historic average across all attempts)
  const domainAggregates: Record<string, { total: number; scoreSum: number }> = {};
  domains.forEach(d => domainAggregates[d] = { total: 0, scoreSum: 0 });

  attempts.forEach(attempt => {
    Object.entries(attempt.domainPerformance || {}).forEach(([domain, score]) => {
      if (domainAggregates[domain]) {
        domainAggregates[domain].total += 1;
        domainAggregates[domain].scoreSum += score as number;
      }
    });
  });

  let weakestDomainName = "Not enough data";
  let weakestDomainScore = 100;

  Object.entries(domainAggregates).forEach(([domain, stats]) => {
    if (stats.total > 0) {
      const avg = Math.round(stats.scoreSum / stats.total);
      if (avg < weakestDomainScore) {
        weakestDomainScore = avg;
        weakestDomainName = domain;
      }
    }
  });

  // 4. Trend Data (Last 7 Exams)
  const trendData = attempts.slice(-7);

  const getScoreColor = (value: number) =>
    value >= 70
      ? "text-emerald-500"
      : value >= 60
      ? "text-amber-500"
      : "text-red-500";

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-sans text-slate-800 relative overflow-hidden select-none">

      {/* FIXED AMBIENT BACKGROUND GLOWS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[100px]"></div>
        <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-96 h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[100px]"></div>
      </div>

      {/* MAIN CONTENT WRAPPER */}
      <div className="relative z-10 max-w-6xl mx-auto">

        {/* CENTERED HERO HEADER */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] mx-auto shadow-lg shadow-indigo-500/30 flex items-center justify-center text-4xl md:text-5xl text-white mb-6 pointer-events-none">
            📊
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
            Dashboard
          </h1>
          <p className="mt-3 text-slate-500 font-bold tracking-wide uppercase text-sm">
            Your Learning Progress
          </p>
        </div>

        {/* 🧠 AI COACH INSIGHT BANNER */}
        {examsTaken > 0 && (
          <div className="mb-8 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl border border-white/20 shadow-inner shrink-0 pointer-events-none">
                🧠
              </div>
              <div className="text-center md:text-left flex-1">
                <p className="text-indigo-200 font-black tracking-widest text-[11px] uppercase mb-1">Coach Insight</p>
                <h3 className="text-white text-xl md:text-2xl font-bold leading-snug">
                  Focus your next study session on{" "}
                  <span className="text-indigo-300 font-black underline decoration-indigo-500/50 underline-offset-4">
                    {weakestDomainName}
                  </span>.
                </h3>
                <p className="text-indigo-100/80 mt-1 font-medium">
                  Your historic average for this domain is currently hovering around {weakestDomainScore}%.
                </p>
              </div>
              {/* ✅ FIXED: passes domainFilter so Exam page can pre-filter to weakest domain */}
              <button
                onClick={() => navigate("/exam", { state: { domainFilter: weakestDomainName } })}
                className="w-full md:w-auto bg-white text-indigo-900 px-6 py-3 rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Start Training
              </button>
            </div>
          </div>
        )}

        {/* ELEVATED KPI CARDS WITH ANIMATED WATERMARKS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200/80 hover:shadow-lg transition-all hover:-translate-y-1 text-center group cursor-default relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-6xl md:text-7xl opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">🎯</div>
            <p className="text-[10px] md:text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1 relative z-10">Readiness Score</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-indigo-600 group-hover:scale-105 transition-transform relative z-10">{averageScore}%</h2>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200/80 hover:shadow-lg transition-all hover:-translate-y-1 text-center group cursor-default relative overflow-hidden">
            <div className="absolute -left-2 -top-2 text-6xl md:text-7xl opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 pointer-events-none">📝</div>
            <p className="text-[10px] md:text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1 relative z-10">Attempts</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-blue-600 group-hover:scale-105 transition-transform relative z-10">{examsTaken}</h2>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200/80 hover:shadow-lg transition-all hover:-translate-y-1 text-center group cursor-default relative overflow-hidden">
            <div className="absolute -right-2 -top-2 text-6xl md:text-7xl opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">⭐</div>
            <p className="text-[10px] md:text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1 relative z-10">Best Score</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-emerald-500 group-hover:scale-105 transition-transform relative z-10">{bestScore}%</h2>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200/80 hover:shadow-lg transition-all hover:-translate-y-1 text-center group cursor-default relative overflow-hidden">
            <div className="absolute -left-4 -bottom-4 text-6xl md:text-7xl opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 pointer-events-none">📈</div>
            <p className="text-[10px] md:text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1 relative z-10">Pass Rate</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-orange-500 group-hover:scale-105 transition-transform relative z-10">{passRate}%</h2>
          </div>
        </div>

        {/* ⏱️ PACING & TREND ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">

          {/* Time Widget */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 text-2xl border border-indigo-100 pointer-events-none">⏳</div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Total Training Time</p>
              <p className="text-2xl font-black tracking-tight text-slate-800">{totalHours}h {totalRemainingMins}m</p>
            </div>
          </div>

          {/* Speed Widget */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex items-center gap-5">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 text-2xl border border-purple-100 pointer-events-none">⚡</div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Global Avg Speed</p>
              <p className="text-2xl font-black tracking-tight text-slate-800">
                {globalAvgTimePerQuestion}s <span className="text-sm font-medium text-slate-400">/ question</span>
              </p>
            </div>
          </div>

          {/* ✅ FIXED: Visual Trend Chart with working tooltips */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-center">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3">Recent Score Trend</p>
            <div className="flex items-end gap-2 h-10 w-full">
              {trendData.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium">No data yet.</p>
              ) : (
                trendData.map((attempt, idx) => {
                  const isPass = attempt.percentage >= 70;
                  return (
                    <div key={idx} className="flex-1 flex flex-col justify-end group/bar relative">
                      {/* Tooltip — appears on hover */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        {attempt.percentage}%
                      </div>
                      {/* Bar */}
                      <div
                        className={`w-full rounded-sm transition-all duration-500 group-hover/bar:brightness-110 ${isPass ? "bg-emerald-400" : "bg-red-400"}`}
                        style={{ height: `${Math.max(10, attempt.percentage)}%` }}
                      ></div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Pass</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Fail</div>
            </div>
          </div>
        </div>

        {/* DOMAIN READINESS TABLE */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 md:p-10 mt-8 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-8">Domain Readiness</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="text-left pb-4 text-[11px] font-black tracking-widest text-slate-400 uppercase">Domain</th>
                  <th className="text-center pb-4 text-[11px] font-black tracking-widest text-slate-400 uppercase">Last %</th>
                  <th className="text-center pb-4 text-[11px] font-black tracking-widest text-slate-400 uppercase">Avg %</th>
                  <th className="text-center pb-4 text-[11px] font-black tracking-widest text-slate-400 uppercase">Accuracy %</th>
                  <th className="text-center pb-4 text-[11px] font-black tracking-widest text-slate-400 uppercase">Trend</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain, index) => {
                  const latest = attempts.length > 0 ? attempts[attempts.length - 1] : null;
                  const previous = attempts.length > 1 ? attempts[attempts.length - 2] : null;
                  const lastPercent = latest?.domainPerformance?.[domain] ?? 0;
                  const avgPercent =
                    attempts.length > 0
                      ? Math.round(
                          attempts.reduce((sum, attempt) => sum + (attempt.domainPerformance?.[domain] ?? 0), 0) /
                            attempts.length
                        )
                      : 0;
                  const trend = previous ? lastPercent - (previous.domainPerformance?.[domain] ?? 0) : null;

                  let accuracy = 0;
                  if (latest?.userAnswers) {
                    const domainQuestions = questions.filter((q) => q.domain === domain);
                    let correct = 0;
                    let attempted = 0;
                    domainQuestions.forEach((question) => {
                      const questionIndex = questions.findIndex((q) => q.id === question.id);
                      const answer = latest.userAnswers[questionIndex];
                      if (answer !== undefined) {
                        attempted++;
                        if (answer === question.correctAnswer) correct++;
                      }
                    });
                    accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
                  }

                  return (
                    <tr key={domain} className={`group ${index === domains.length - 1 ? "" : "border-b border-slate-100"}`}>
                      <td className="py-5 font-bold text-slate-800 text-base md:text-lg group-hover:text-indigo-600 transition-colors">{domain}</td>
                      <td className={`text-center font-black tracking-tight text-lg md:text-xl ${getScoreColor(lastPercent)}`}>{lastPercent}%</td>
                      <td className={`text-center font-black tracking-tight text-lg md:text-xl ${getScoreColor(avgPercent)}`}>{avgPercent}%</td>
                      <td className={`text-center font-black tracking-tight text-lg md:text-xl ${getScoreColor(accuracy)}`}>{accuracy}%</td>
                      <td className={`text-center font-black tracking-tight text-lg md:text-xl ${trend === null ? "text-slate-300" : trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-500" : "text-slate-400"}`}>
                        {trend === null ? "—" : trend > 0 ? `↑ ${trend}%` : trend < 0 ? `↓ ${Math.abs(trend)}%` : "→ 0%"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT ATTEMPTS LIST */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 md:p-10 mt-8 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-8">Recent Attempts</h2>

          {attempts.length === 0 ? (
            <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 font-semibold">
              <span className="text-4xl block mb-3 pointer-events-none">📭</span>
              No attempts found. Time to take your first mock exam!
            </div>
          ) : (
            <div className="space-y-4">
              {attempts
                .slice()
                .reverse()
                .slice(0, 5)
                .map((attempt, index) => {
                  const cardStyle =
                    attempt.percentage >= 70
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100"
                      : attempt.percentage >= 60
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100"
                      : "bg-gradient-to-r from-red-50 to-rose-50 border-red-100";

                  return (
                    <div
                      key={index}
                      onClick={() => navigate("/attempt-detail", { state: { attempt } })}
                      className={`
                        group rounded-2xl p-5 md:p-6 transition-all duration-300 cursor-pointer border shadow-sm
                        hover:shadow-md hover:scale-[1.01] flex flex-col md:flex-row justify-between items-start md:items-center gap-4
                        ${cardStyle}
                      `}
                    >
                      <div>
                        <p className="font-black text-lg md:text-xl text-slate-800 tracking-tight">
                          {new Date(attempt.date).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="bg-white/80 px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest text-slate-600 uppercase shadow-sm">
                            Correct: <span className="text-slate-900">{attempt.score}/{attempt.total}</span>
                          </span>
                          <span className="bg-white/80 px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest text-slate-600 uppercase shadow-sm">
                            Flagged: <span className="text-slate-900">{attempt.flaggedCount}</span>
                          </span>
                          <span className="bg-white/80 px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest text-slate-600 uppercase shadow-sm">
                            Time: <span className="text-slate-900">{Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s</span>
                          </span>
                        </div>
                      </div>
                      <div className="w-full md:w-auto text-right mt-2 md:mt-0">
                        <p className={`text-5xl md:text-6xl font-black tracking-tighter group-hover:scale-110 transition-transform origin-right ${getScoreColor(attempt.percentage)}`}>
                          {attempt.percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="mt-12 mb-16 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6">
          <button
            onClick={() => navigate("/")}
            className="group w-full md:w-auto bg-white text-slate-700 border-2 border-slate-200 px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black tracking-tight shadow-sm hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 hover:scale-[1.02] text-xl md:text-2xl"
          >
            <span className="text-2xl group-hover:-translate-x-2 transition-transform duration-300 pointer-events-none">🏠</span>
            Go to Home
          </button>

          <button
            onClick={() => navigate("/attempt-history")}
            className="group w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black tracking-tight shadow-[0_4px_15px_rgba(99,102,241,0.4)] hover:brightness-110 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 hover:scale-[1.02] text-xl md:text-2xl"
          >
            <span className="text-2xl group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 pointer-events-none">⚡</span>
            View All Attempts
          </button>
        </div>

      </div>
    </div>
  );
}