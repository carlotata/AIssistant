import { SparklesIcon, ListChecksIcon } from "../icons/dashboard-icons";

type Recommendation = { topic: string, questions: number };

type AIDashboardPanelProps = {
    onTakeQuiz: (topic: string) => void;
    recommendations: Recommendation[];
};

export function AIDashboardPanel({ onTakeQuiz, recommendations }: AIDashboardPanelProps) {
    return (
        <aside className="w-80 border-l border-white/5 bg-slate-900 p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2 text-indigo-400">
                <SparklesIcon className="h-6 w-6" />
                <h2 className="text-lg font-bold text-white">AI Study Companion</h2>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recommended Quizzes</h3>
                {recommendations.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => onTakeQuiz(s.topic)}
                        className="w-full text-left bg-slate-800 hover:bg-slate-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 rounded-2xl p-5 border border-white/5 cursor-pointer"
                    >
                        <p className="text-sm font-bold text-white mb-1">{s.topic}</p>
                        <p className="text-xs text-slate-400">{s.questions} Questions</p>
                    </button>
                ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</h3>
                <button 
                    className="w-full p-4 rounded-xl bg-slate-800 border border-white/5 hover:border-indigo-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-slate-300 text-sm font-bold cursor-pointer"
                >
                    Review Weak Topics
                </button>
            </div>
        </aside>
    );
}
