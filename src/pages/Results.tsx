import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveAttempt } from "../services/storage";
import ReactMarkdown from "react-markdown";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Flag to track execution across renders in React Strict Mode
  const hasSaved = useRef(false);

  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  
  // --- AI Feature States ---
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState<{ index: number; type: string } | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});

  const score = location.state?.score ?? 0;
  const total = location.state?.total ?? 0;
  const flaggedCount = location.state?.flaggedCount ?? 0;
  const timeTaken = location.state?.timeTaken ?? 0;
  const questionStats = location.state?.questionStats ?? {};
  const userAnswers = location.state?.userAnswers ?? {};
  const questions = location.state?.questions ?? [];

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // ==========================
  // Domain Performance
  // ==========================

  const domainStats: Record<
    string,
    { correct: number; wrong: number; unanswered: number; total: number; }
  > = {};

  questions.forEach((question: any, index: number) => {
    const domain = question.domain;

    if (!domainStats[domain]) {
      domainStats[domain] = { correct: 0, wrong: 0, unanswered: 0, total: 0 };
    }

    domainStats[domain].total++;

    const answer = userAnswers[index];

    if (answer === undefined) {
      domainStats[domain].unanswered++;
    } else if (answer === question.correctAnswer) {
      domainStats[domain].correct++;
    } else {
      domainStats[domain].wrong++;
    }
  });

  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;

    const domainPerformance: Record<string, number> = {};

    Object.entries(domainStats).forEach(([domain, stats]) => {
      domainPerformance[domain] =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    });

    saveAttempt({
      date: new Date().toISOString(),
      score,
      total,
      percentage,
      flaggedCount,
      timeTaken,
      questionStats,
      userAnswers,
      domainPerformance,
      questions, 
      flaggedQuestions: location.state?.flaggedQuestions ?? [], 
    });
  }, [score, total, percentage, flaggedCount, timeTaken, questionStats, userAnswers, questions, location.state?.flaggedQuestions]);

  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;
  const attemptedCount = Object.keys(userAnswers).length;
  const untouchedCount = total - attemptedCount;
  const avgTimePerQuestion = attemptedCount > 0 ? (timeTaken / attemptedCount).toFixed(1) : "0";
  const correctCount = score;
  const wrongCount = attemptedCount - correctCount;
  const avgTimePerWrong = wrongCount > 0 ? (timeTaken / wrongCount).toFixed(1) : "0";
  
  const scoreColor =
    percentage >= 70
      ? "text-emerald-500"
      : percentage >= 60
      ? "text-amber-500"
      : "text-red-500";

  const reviewQuestions = questions.filter((question: any, index: number) => {
    const answer = userAnswers[index];
    return answer === undefined || answer !== question.correctAnswer;
  });

  // ==========================
  // Core AI Overview Generator
  // ==========================
  const explainWithAI = async (question: any, index: number) => {
    if (aiExplanations[index]) return;

    setGeneratingId(index);

    const userAnswer = userAnswers[index] !== undefined ? question.options[userAnswers[index]] : "Not Answered";
    const correctAnswer = question.options[question.correctAnswer];

    const prompt = `Act as a Microsoft ${question.exam || "certification"} trainer.\n\nI answered the following question incorrectly.\n\nQuestion:\n${question.question}\n\nOptions:\n${question.options.map((option: string, i: number) => `${String.fromCharCode(65 + i)}. ${option}`).join("\n")}\n\nMy Answer:\n${userAnswer}\n\nCorrect Answer:\n${correctAnswer}\n\nDomain:\n${question.domain}\n\nDifficulty:\n${question.difficulty}\n\nPlease explain:\n1. Why the correct answer is correct\n2. Why my answer is wrong\n3. Why the other options are incorrect\n4. The exam concept being tested\n5. Real-world usage\n6. Exam tips and traps.\n\nKeep the formatting clean with spacing and bullet points.`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key missing! Please add VITE_GEMINI_API_KEY to your .env file and restart Vite.");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      setAiExplanations((prev) => ({ ...prev, [index]: text }));
    } catch (error: any) {
      console.error("AI Error:", error);
      setAiExplanations((prev) => ({ 
        ...prev, 
        [index]: `⚠️ Failed to generate explanation: ${error.message}` 
      }));
    } finally {
      setGeneratingId(null);
    }
  };

  // ==========================
  // Follow-up Deep Dive Generator
  // ==========================
  const handleDeepDive = async (index: number, type: "simplify" | "analogy" | "example") => {
    setDeepDiveLoading({ index, type });
    const question = questions[index];
    const userAnswer = userAnswers[index] !== undefined ? question.options[userAnswers[index]] : "Not Answered";
    const correctAnswer = question.options[question.correctAnswer];
    const currentExplanation = aiExplanations[index] || "";

    let instructionModifier = "";
    if (type === "simplify") {
      instructionModifier = "The user is still finding this concept difficult. Please rewrite the core mechanics of why the correct option is right using extremely simple terms (Explain Like I'm 5 style). Avoid heavy technical jargon, use plain language, and keep it crisp.";
    } else if (type === "analogy") {
      instructionModifier = "The user is struggling to map this concept mentally. Provide a vivid, memorable real-world analogy (e.g., using a library, kitchen management, physical storage boxes, or traffic highway rules) that mirrors how this technical feature behaves compared to the wrong choices.";
    } else if (type === "example") {
      instructionModifier = "The user wants a hands-on perspective. Provide a crystal-clear, step-by-step practical implementation scenario or business problem showing exactly where they would click or what code they would apply to configure this correctly.";
    }

    const deepDivePrompt = `You are an expert trainer. Here is the target context:\n\nQuestion: ${question.question}\nCorrect Answer: ${correctAnswer}\nUser Answer: ${userAnswer}\n\nYour previous high-level explanation was:\n${currentExplanation}\n\nTask: ${instructionModifier}\n\nKeep your breakdown precise, structural, and immediately helpful. Do not output metadata or introductory padding. Go straight into the content.`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key configuration error.");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(deepDivePrompt);
      const text = await result.response.text();

      const headingTitle = 
        type === "simplify" 
          ? "👶 Simplified View (ELI5)" 
          : type === "analogy" 
          ? "🧩 Conceptual Analogy" 
          : "🛠️ Practical Step-by-Step Example";

      setAiExplanations((prev) => ({
        ...prev,
        [index]: `${prev[index]}\n\n---\n\n### ${headingTitle}\n\n${text}`
      }));
    } catch (error: any) {
      console.error("Deep Dive Error:", error);
    } finally {
      setDeepDiveLoading(null);
    }
  };

  return (
    // Global select-none to kill the blinking cursor everywhere
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-sans text-slate-800 flex flex-col items-center select-none">

      <div className="w-full max-w-5xl bg-white border border-slate-200/60 rounded-[2rem] p-6 md:p-10 shadow-sm">

        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto shadow-lg shadow-indigo-500/30 flex items-center justify-center text-4xl text-white mb-6 pointer-events-none">
            🏆
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Exam Complete</h1>
          <p className="mt-3 text-slate-500 font-semibold tracking-wide">Performance Breakdown</p>
        </div>

        {/* SCORE DISPLAY */}
        <div className="flex flex-col items-center justify-center mb-12">
          <h2 className={`text-8xl md:text-9xl font-black tracking-tighter ${scoreColor} drop-shadow-sm`}>
            {percentage}%
          </h2>
          <div className="bg-slate-100 px-6 py-2.5 rounded-full mt-6 font-black tracking-tight text-slate-700 text-lg">
            {score} / {total} Correct
          </div>
        </div>

        {/* DASHBOARD KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Time Taken</p>
            <p className="text-2xl md:text-3xl font-black tracking-tight text-indigo-600">{minutes}m {seconds}s</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Attempted</p>
            <p className="text-2xl md:text-3xl font-black tracking-tight text-blue-600">{attemptedCount}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Untouched</p>
            <p className="text-2xl md:text-3xl font-black tracking-tight text-slate-600">{untouchedCount}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Flagged</p>
            <p className="text-2xl md:text-3xl font-black tracking-tight text-orange-500">{flaggedCount}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Avg / Question</p>
            <p className="text-2xl md:text-3xl font-black tracking-tight text-purple-600">{avgTimePerQuestion}s</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Avg / Wrong</p>
            <p className="text-2xl md:text-3xl font-black tracking-tight text-red-500">{avgTimePerWrong}s</p>
          </div>
        </div>        

        {/* DOMAIN PERFORMANCE */}
        <div className="mt-16 bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100">
          <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-8">Domain Analysis</h3>
          
          <div className="space-y-6">
            {Object.entries(domainStats).map(([domain, stats]) => {
              const domainPercentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
              return (
                <div key={domain} className="w-full">
                  <div className="flex justify-between items-end mb-2">
                    <p className="font-bold text-slate-700 text-sm md:text-base pr-4">{domain}</p>
                    <p className="font-black tracking-tighter text-slate-900">{domainPercentage > 0 ? `${domainPercentage}%` : "0%"}</p>
                  </div>
                  <div className="w-full flex h-3 md:h-4 rounded-full overflow-hidden bg-slate-200 shadow-inner">
                    <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full" style={{ width: `${(stats.correct / stats.total) * 100}%` }} />
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full" style={{ width: `${(stats.wrong / stats.total) * 100}%` }} />
                    <div className="bg-gradient-to-r from-slate-300 to-slate-400 h-full" style={{ width: `${(stats.unanswered / stats.total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-10 flex justify-center gap-6 text-[11px] uppercase tracking-widest font-black text-slate-500">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400"></div> Correct</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div> Wrong</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Unanswered</div>
          </div>
        </div>

        {/* QUESTION REVIEW & AI INTEGRATION */}
        <div className="mt-16">
          <h3 className="text-2xl font-black tracking-tight text-slate-900">Question Review</h3>
          <p className="text-sm font-semibold text-slate-500 mt-1 mb-8">
            Focus areas: {wrongCount} Wrong | {untouchedCount} Unanswered
          </p>

          {reviewQuestions.length === 0 ? (
            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-2xl p-6 font-black tracking-tight shadow-md flex items-center justify-center text-lg">
              🎉 Flawless Victory! No questions to review.
            </div>
          ) : (
            <>
              {/* Gel Buttons Map */}
              <div className="flex flex-wrap gap-3 mb-8">
                {reviewQuestions.map((question: any) => {
                  const originalIndex = questions.findIndex((q: any) => q.id === question.id);
                  const userAnswer = userAnswers[originalIndex];
                  const isUnanswered = userAnswer === undefined;
                  const isSelected = expandedQuestion === originalIndex;

                  let styling = isUnanswered 
                    ? "bg-gradient-to-br from-slate-200 to-slate-400 shadow-slate-400/30 text-slate-700" 
                    : "bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-500/30 text-white";

                  if (isSelected) {
                    styling = "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40 text-white font-black scale-110 ring-4 ring-indigo-500/20";
                  }

                  return (
                    <button
                      key={question.id}
                      onClick={() => setExpandedQuestion(originalIndex)}
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl font-black shadow-md transition-all duration-200 hover:scale-105 ${styling}`}
                    >
                      {originalIndex + 1}
                    </button>
                  );
                })}
              </div>

              {/* Expanded AI Card */}
              {expandedQuestion !== null && (() => {
                const question = questions[expandedQuestion];
                const userAnswer = userAnswers[expandedQuestion];
                const isUnanswered = userAnswer === undefined;
                
                const isGeneratingCurrent = generatingId === expandedQuestion;
                const aiResponse = aiExplanations[expandedQuestion];

                return (
                  <div className="border-2 border-indigo-50 rounded-3xl p-6 md:p-8 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fadeIn">
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                      <h4 className="font-black tracking-tight text-xl text-slate-800 flex items-center gap-3">
                        <span className="text-2xl pointer-events-none">{isUnanswered ? "⬜" : "❌"}</span> Question {expandedQuestion + 1}
                      </h4>
                      
                      {/* Premium AI Request Button */}
                      <button
                        onClick={() => explainWithAI(question, expandedQuestion)}
                        disabled={isGeneratingCurrent || !!aiResponse}
                        className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-bold shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2 ${
                          aiResponse 
                            ? "bg-slate-100 text-slate-400 shadow-none cursor-default" 
                            : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-[1.02] active:scale-95"
                        }`}
                      >
                        <span className={`text-xl leading-none pointer-events-none ${isGeneratingCurrent ? "animate-spin" : ""}`}>
                          {isGeneratingCurrent ? "⏳" : "✨"}
                        </span> 
                        {isGeneratingCurrent ? "Analyzing..." : aiResponse ? "Explanation Generated" : "Ask AI Tutor"}
                      </button>
                    </div>

                    {/* Question Breakdown - select-auto allows copying the specific question text */}
                    <div className="space-y-6 select-auto">
                      <div>
                        <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2">Question Context</p>
                        <p className="text-slate-800 font-semibold leading-relaxed text-lg">{question.question}</p>
                      </div>

                      <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5">
                        <p className="text-[11px] font-black tracking-widest text-red-400 uppercase mb-2">Your Answer</p>
                        <p className="text-red-700 font-bold">
                          {isUnanswered ? "Left Blank" : question.options[userAnswer]}
                        </p>
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                        <p className="text-[11px] font-black tracking-widest text-emerald-500 uppercase mb-2">Correct Answer</p>
                        <p className="text-emerald-700 font-bold">
                          {question.options[question.correctAnswer]}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                        <div>
                          <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Domain</p>
                          <p className="font-bold text-slate-700">{question.domain}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Difficulty</p>
                          <p className="font-bold text-slate-700">{question.difficulty}</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Response Box & Deep Dive Controls (MOVED TO BOTTOM) */}
                    {aiResponse && (
                      <div className="mt-10 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 md:p-8 shadow-inner animate-fadeIn select-auto">
                        <div className="flex items-center gap-2 mb-4 border-b border-indigo-100 pb-3">
                          <span className="text-2xl select-none">✨</span>
                          <h5 className="font-black tracking-tight text-lg text-indigo-900 uppercase">AI Tutor Explanation</h5>
                        </div>
                        
                        <div className="text-slate-700 text-sm md:text-base font-medium">
                          <ReactMarkdown
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-xl font-bold text-slate-900 mt-6 mb-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-800 mt-5 mb-2" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-base font-bold text-indigo-800 mt-4 mb-2" {...props} />,
                              p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="text-slate-700" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                              hr: ({node, ...props}) => <hr className="my-6 border-indigo-100" {...props} />,
                            }}
                          >
                            {aiResponse}
                          </ReactMarkdown>
                        </div>

                        {/* DEEP DIVE ACTION ROW */}
                        <div className="mt-8 pt-4 border-t border-indigo-100/60 select-none">
                          <p className="text-[11px] font-black tracking-widest text-indigo-500 uppercase mb-3">
                            Still unclear? Take a deep dive:
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => handleDeepDive(expandedQuestion, "simplify")}
                              disabled={deepDiveLoading !== null}
                              className="bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs md:text-sm px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95 hover:shadow-md"
                            >
                              {deepDiveLoading?.index === expandedQuestion && deepDiveLoading?.type === "simplify"
                                ? "🔄 Simplifying..."
                                : "👶 Simplify Concept (ELI5)"}
                            </button>

                            <button
                              onClick={() => handleDeepDive(expandedQuestion, "analogy")}
                              disabled={deepDiveLoading !== null}
                              className="bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs md:text-sm px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95 hover:shadow-md"
                            >
                              {deepDiveLoading?.index === expandedQuestion && deepDiveLoading?.type === "analogy"
                                ? "🔄 Thinking..."
                                : "🧩 Give Me an Analogy"}
                            </button>

                            <button
                              onClick={() => handleDeepDive(expandedQuestion, "example")}
                              disabled={deepDiveLoading !== null}
                              className="bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs md:text-sm px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95 hover:shadow-md"
                            >
                              {deepDiveLoading?.index === expandedQuestion && deepDiveLoading?.type === "example"
                                ? "🔄 Building..."
                                : "🛠️ Show Practical Example"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>

        <div className="flex justify-center mt-16 pt-8 border-t border-slate-100">
          <button
            onClick={() => navigate("/")}
            className="group w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-700 text-white text-slate-700 border-2 border-slate-200 px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black tracking-tight shadow-sm hover:border-indigo-400  hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 hover:scale-[1.02] text-xl md:text-2xl"
          >
            <span className="text-2xl group-hover:-translate-x-2 transition-transform duration-300 pointer-events-none">
              🏠
            </span> 
            Return to Home
          </button>
        </div>

      </div>
    </div>
  );
}