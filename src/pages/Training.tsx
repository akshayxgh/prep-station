import { useNavigate } from "react-router-dom";
import { getAttempts } from "../services/storage";

export default function Training() {
  const navigate = useNavigate();
  const attempts = getAttempts();
  
  const domains = [
    { name: "Prepare Data", icon: "🧹", color: "from-blue-400 to-blue-600" },
    { name: "Model Data", icon: "📐", color: "from-indigo-400 to-indigo-600" },
    { name: "Visualize & Analyze", icon: "📊", color: "from-purple-400 to-purple-600" },
    { name: "Manage & Secure", icon: "🔒", color: "from-emerald-400 to-emerald-600" },
  ];

  const getDomainScore = (domain: string) => {
    const relevantAttempts = attempts.flatMap(a => Object.entries(a.domainPerformance || {}));
    const scores = relevantAttempts.filter(([d]) => d === domain).map(([, s]) => s as number);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 select-none font-sans">
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Topic Trainer</h1>
          <p className="text-slate-500 font-bold tracking-wide uppercase text-sm">Select your focus area</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {domains.map((domain) => {
            const score = getDomainScore(domain.name);
            return (
              <button
                key={domain.name}
                onClick={() => navigate("/exam", { state: { domainFilter: domain.name } })}
                className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group text-left"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${domain.color} flex items-center justify-center text-3xl mb-6 shadow-lg shadow-indigo-500/20`}>
                  {domain.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{domain.name}</h3>
                <p className="text-slate-500 font-medium mb-6">Master the {domain.name} concepts with focused practice.</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Readiness</span>
                  <span className={`text-lg font-black ${score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{score}%</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* BOTTOM-CENTERED GO TO HOME BUTTON */}
        <div className="mt-16 flex justify-center pb-10">
          <button
            onClick={() => navigate("/")}
            className="group w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-700 text-white text-slate-700 border-2 border-slate-200 px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black tracking-tight shadow-sm hover:border-indigo-400  hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 hover:scale-[1.02] text-xl md:text-2xl"
          >
            <span className="text-2xl group-hover:-translate-x-2 transition-transform duration-300 pointer-events-none">
              🏠
            </span> 
            Go to Home
          </button>
        </div>

      </div>
    </div>
  );
}