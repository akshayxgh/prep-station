import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ExamAttempt } from "../services/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function AttemptDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const attempt = location.state?.attempt as ExamAttempt | undefined;

  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  
  // AI Feature States
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState<{ index: number; type: string } | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});

  if (!attempt) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-8 select-none">
        <h2 className="text-3xl font-black tracking-tight mb-4 text-slate-800">Attempt Data Not Found</h2>
        <p className="text-slate-500 font-medium mb-8">Please select an attempt from the dashboard to view its details.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-[0_4px_15px_rgba(99,102,241,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const {
    date,
    score,
    total,
    percentage,
    flaggedCount = 0, // Restored
    timeTaken,
    questionStats = {},
    userAnswers = {},
    questions = [],
    domainPerformance = {},
  } = attempt;

  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;
  const attemptedCount = Object.keys(userAnswers).length;
  const untouchedCount = total - attemptedCount;

  const correctCount = score;
  const wrongCount = attemptedCount - correctCount;
  
  // Restored Logic
  const avgTimePerQuestion = attemptedCount > 0 ? (timeTaken / attemptedCount).toFixed(1) : "0";

  const scoreColor =
    percentage >= 70
      ? "text-emerald-500"
      : percentage >= 60
      ? "text-amber-500"
      : "text-red-500";

  let strongestDomain = { name: "N/A", score: -1 };
  let weakestDomain = { name: "N/A", score: 101 };

  Object.entries(domainPerformance).forEach(([name, dScore]) => {
    if (dScore > strongestDomain.score) strongestDomain = { name, score: dScore };
    if (dScore < weakestDomain.score) weakestDomain = { name, score: dScore };
  });

  let mostTimeSpent = { index: -1, time: -1 };
  Object.entries(questionStats).forEach(([qIndexStr, time]) => {
    const timeNum = Number(time);
    if (timeNum > mostTimeSpent.time) {
      mostTimeSpent = { index: Number(qIndexStr), time: timeNum };
    }
  });

  const domainStats: Record<
    string,
    { correct: number; wrong: number; unanswered: number; total: number }
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

  // Core AI Overview Generator
  const explainWithAI = async (question: any, index: number) => {
    if (aiExplanations[index]) return;

    setGeneratingId(index);

    const userAnswer = userAnswers[index] !== undefined ? question.options[userAnswers[index]] : "Not Answered";
    const correctAnswer = question.options[question.correctAnswer];

    const prompt = `Act as a Microsoft ${question.exam || "PL-300"} certification trainer.\n\nI answered the following question incorrectly.\n\nQuestion:\n${question.question}\n\nOptions:\n${question.options.map((option: string, i: number) => `${String.fromCharCode(65 + i)}. ${option}`).join("\n")}\n\nMy Answer:\n${userAnswer}\n\nCorrect Answer:\n${correctAnswer}\n\nDomain:\n${question.domain}\n\nDifficulty:\n${question.difficulty}\n\nPlease explain:\n1. Why the correct answer is correct\n2. Why my answer is wrong\n3. Why the other options are incorrect\n4. The exam concept being tested\n5. Real-world usage\n6. Exam tips and traps.\n\nKeep the formatting clean with spacing and bullet points.`;

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

  // Follow-up Deep Dive Generator
  const handleDeepDive = async (index: number, type: "simplify" | "analogy" | "example") => {
    setDeepDiveLoading({ index, type });
    const question = questions[index];
    const userAnswer = userAnswers[index] !== undefined ? question.options[userAnswers[index]] : "Not Answered";
    const correctAnswer = question.options[question.correctAnswer];
    const currentExplanation = aiExplanations[index] || "";

    let instructionModifier = "";
    if (type === "simplify") {
      instructionModifier = "The user is still finding this concept difficult. Please rewrite the core mechanics of why the correct option is right using extremely simple terms (Explain Like I'm 5 style). Avoid heavy database or BI jargon, use plain language, and keep it crisp.";
    } else if (type === "analogy") {
      instructionModifier = "The user is struggling to map this concept mentally. Provide a vivid, memorable real-world analogy (e.g., using a library, kitchen management, physical storage boxes, or traffic highway rules) that mirrors how this technical Power BI feature behaves compared to the wrong choices.";
    } else if (type === "example") {
      instructionModifier = "The user wants a hands-on perspective. Provide a crystal-clear, step-by-step practical implementation scenario or business problem inside Power BI Desktop showing exactly where they would click or what code they would apply to configure this correctly.";
    }

    const deepDivePrompt = `You are the Microsoft PL-300 trainer. Here is the target context:\n\nQuestion: ${question.question}\nCorrect Answer: ${correctAnswer}\nUser Answer: ${userAnswer}\n\nYour previous high-level explanation was:\n${currentExplanation}\n\nTask: ${instructionModifier}\n\nKeep your breakdown precise, structural, and immediately helpful. Do not output metadata or introductory padding. Go straight into the content.`;

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
      
      <div className="w-full max-w-5xl mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-slate-500 hover:text-indigo-600 transition font-bold text-sm flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 w-fit hover:shadow-md hover:-translate-x-1"
        >
          <span className="text-lg leading-none -mt-0.5">‹</span> Back to Dashboard
        </button>
      </div>

      <div className="w-full max-w-5xl bg-white border border-slate-200/60 rounded-[2rem] p-6 md:p-10 shadow-sm">
        
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto shadow-lg shadow-indigo-500/30 flex items-center justify-center text-3xl md:text-4xl text-white mb-6 pointer-events-none">
            📋
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Attempt Report</h1>
          <p className="mt-3 text-slate-500 font-semibold tracking-wide">
            {new Date(date).toLocaleString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit", hour12: true,
            })}
          </p>
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

        {/* PERFORMANCE SUMMARY CARDS - Now 6 Cards! */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          
          {/* General Stats Row */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all text-center">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2">Time Taken</p>
            <p className="text-xl md:text-3xl font-black tracking-tight text-indigo-600 leading-tight">
              {minutes}m {seconds}s
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all text-center">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2">Flagged</p>
            <p className="text-xl md:text-3xl font-black tracking-tight text-orange-500 leading-tight">
              {flaggedCount}
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all text-center">
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2">Avg / Question</p>
            <p className="text-xl md:text-3xl font-black tracking-tight text-purple-600 leading-tight">
              {avgTimePerQuestion}s
            </p>
          </div>

          {/* Deep Analytics Row */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all text-center">
            <p className="text-[11px] font-black tracking-widest text-emerald-500 uppercase mb-2">Strongest Domain</p>
            <p className="text-xl md:text-2xl font-black tracking-tight text-slate-800 leading-tight">
              {strongestDomain.name} <span className="text-base text-emerald-500 ml-1">({strongestDomain.score}%)</span>
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all text-center">
            <p className="text-[11px] font-black tracking-widest text-red-500 uppercase mb-2">Weakest Domain</p>
            <p className="text-xl md:text-2xl font-black tracking-tight text-slate-800 leading-tight">
              {weakestDomain.name} <span className="text-base text-red-500 ml-1">({weakestDomain.score}%)</span>
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all text-center">
            <p className="text-[11px] font-black tracking-widest text-indigo-500 uppercase mb-2">Most Time Spent</p>
            <p className="text-xl md:text-2xl font-black tracking-tight text-slate-800 leading-tight">
              {mostTimeSpent.index !== -1 ? `Q${mostTimeSpent.index + 1}` : "N/A"}
              {mostTimeSpent.index !== -1 && <span className="text-base text-indigo-500 ml-2">({mostTimeSpent.time}s)</span>}
            </p>
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

        {/* FULL EXAM REVIEW & AI INTEGRATION */}
        <div className="mt-16">
          <h3 className="text-2xl font-black tracking-tight text-slate-900">Exam Review</h3>
          <p className="text-sm font-semibold text-slate-500 mt-1 mb-8">
            {correctCount} Correct | {wrongCount} Wrong | {untouchedCount} Unanswered
          </p>

          {/* Gel Buttons Map */}
          <div className="flex flex-wrap gap-3 mb-8">
            {questions.map((question: any, index: number) => {
              const userAnswer = userAnswers[index];
              const isUnanswered = userAnswer === undefined;
              const isCorrect = userAnswer === question.correctAnswer;
              const isSelected = expandedQuestion === index;

              // 4-state styling matching your 3D gel aesthetic
              let styling = isCorrect 
                ? "bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-500/30 text-white" 
                : isUnanswered 
                ? "bg-gradient-to-br from-slate-200 to-slate-400 shadow-slate-400/30 text-slate-700"
                : "bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-500/30 text-white";

              if (isSelected) {
                styling = "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40 text-white font-black scale-110 ring-4 ring-indigo-500/20";
              }

              return (
                <button
                  key={index}
                  onClick={() => setExpandedQuestion(index)}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl font-black shadow-md transition-all duration-200 hover:scale-105 ${styling}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Expanded Card */}
          {expandedQuestion !== null && (() => {
            const question = questions[expandedQuestion];
            const userAnswer = userAnswers[expandedQuestion];
            const isUnanswered = userAnswer === undefined;
            const isCorrect = userAnswer === question.correctAnswer;
            
            const isGeneratingCurrent = generatingId === expandedQuestion;
            const aiResponse = aiExplanations[expandedQuestion];

            return (
              <div className="border-2 border-indigo-50 rounded-3xl p-6 md:p-8 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fadeIn">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                  <h4 className="font-black tracking-tight text-xl text-slate-800 flex items-center gap-3">
                    <span className="text-2xl pointer-events-none">
                      {isCorrect ? "✅" : isUnanswered ? "⬜" : "❌"}
                    </span> 
                    Question {expandedQuestion + 1}
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
                    {isGeneratingCurrent ? "Analyzing..." : aiResponse ? "Explanation Generated" : "Explain with AI"}
                  </button>
                </div>

                {/* Question Breakdown - select-auto allows copying text */}
                <div className="space-y-6 select-auto">
                  <div>
                    <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2">Question Context</p>
                    <p className="text-slate-800 font-semibold leading-relaxed text-lg">{question.question}</p>
                  </div>

                  {/* Render Answer Blocks based on Correct/Incorrect */}
                  {isCorrect ? (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                      <p className="text-[11px] font-black tracking-widest text-emerald-500 uppercase mb-2">Correct Answer</p>
                      <p className="text-emerald-700 font-bold">
                        {question.options[question.correctAnswer]}
                      </p>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}

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

                {/* AI Response Box & Deep Dive Controls */}
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
        </div>

      </div>
    </div>
  );
}