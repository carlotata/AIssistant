import { SparklesIcon, ListChecksIcon } from "../icons/dashboard-icons";

type Recommendation = { topic: string, questions: number };

type AIDashboardPanelProps = {
    onTakeQuiz: (topic: string) => void;
    onReviewWeakTopics: () => void;
    recommendations: Recommendation[];
};

export function AIDashboardPanel({ onTakeQuiz, onReviewWeakTopics, recommendations }: AIDashboardPanelProps) {
    return (
        <aside className="w-full lg:w-80 lg:border-l border-white/5 bg-slate-900/50 lg:bg-slate-900 p-6 flex flex-col gap-6 rounded-xl lg:rounded-none">
            <div className="flex items-center gap-2 text-indigo-400">
                <SparklesIcon className="h-6 w-6 shrink-0" />
                <h2 className="text-lg font-bold text-white">AI Study Companion</h2>
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommended Quizzes</h3>
                <div className="space-y-3">
                    {recommendations.length > 0 ? recommendations.map((s, i) => (
                        <button 
                            key={i}
                            onClick={() => onTakeQuiz(s.topic)}
                            className="w-full text-left bg-slate-800 hover:bg-slate-700 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md rounded-lg p-5 border border-white/5 cursor-pointer group"
                        >
                            <p className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{s.topic}</p>
                            <p className="text-xs text-slate-400">{s.questions} Questions</p>
                        </button>
                    )) : (
                        <p className="text-xs text-slate-500 italic">No recommendations yet.</p>
                    )}
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Actions</h3>
                <button 
                    onClick={onReviewWeakTopics}
                    className="w-full p-4 rounded-lg bg-slate-800 border border-white/5 hover:border-indigo-500/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-md text-slate-300 text-sm font-bold cursor-pointer"
                >
                    Review Weak Topics
                </button>
            </div>
        </aside>
    );
}
