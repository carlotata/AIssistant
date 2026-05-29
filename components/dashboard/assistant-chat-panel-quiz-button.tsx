import { useState } from "react";
import { apiFetch, ensureCsrfToken } from "@/lib/api";
import type { Quiz } from "@/types/dashboard";

type Difficulty = 'easy' | 'medium' | 'hard';

export function QuizGeneratorButton({ topic, count, conversationId, onNavigate, recentQuizzes }: { topic: string, count: number, conversationId: number, onNavigate: (v: string) => void, recentQuizzes: Quiz[] }) {
    const [quizQuestionCount, setQuizQuestionCount] = useState(count);
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

    const existingQuiz = recentQuizzes.find(q => 
        q.quizTopic.toLowerCase().includes(topic.toLowerCase()) && 
        Number((q as any).conversationId) === Number(conversationId)
    );

    return (
        <div className="mt-4 p-5 rounded-2xl bg-slate-800/80 border border-indigo-500/20 shadow-lg backdrop-blur-sm space-y-4">
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-indigo-400 font-bold text-sm truncate max-w-[70%]">Quiz: {capitalizedTopic}</span>
                {(!existingQuiz || existingQuiz.state !== 'COMPLETED') && (
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer whitespace-nowrap"
                    >
                        {showSettings ? "Close Settings" : "Quiz Settings"}
                    </button>
                )}
            </div>
            
            {showSettings && (!existingQuiz || existingQuiz.state !== 'COMPLETED') && (
                <div className="space-y-5 animate-in slide-in-from-top-2 duration-200 border-t border-slate-700 pt-4">
                    {/* Questions Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold text-xs">Questions</span>
                            <span className="text-indigo-400 font-bold text-xs">{quizQuestionCount}</span>
                        </div>
                        <input 
                            type="range" min="1" max="10" value={quizQuestionCount} 
                            onChange={e => setQuizQuestionCount(parseInt(e.target.value))} 
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all" 
                        />
                    </div>
                    
                    {/* Difficulty Checklist */}
                    <div className="space-y-2">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Difficulty</span>
                        <div className="grid grid-cols-3 gap-2">
                            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                                // Color mapping
                                const colorStyles = {
                                    easy: difficulty === d ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-emerald-500/50',
                                    medium: difficulty === d ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-amber-500/50',
                                    hard: difficulty === d ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-rose-500/50'
                                };
                                return (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`px-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${colorStyles[d]} cursor-pointer`}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            {!existingQuiz || existingQuiz.state !== 'COMPLETED' ? (
                <button 
                    onClick={async () => {
                        setIsGenerating(true);
                        await ensureCsrfToken();
                        const response = await apiFetch<{ quiz: { id: number } }>("/quizzes", {
                            method: "POST",
                            body: JSON.stringify({ quizTopic: topic, questionCount: quizQuestionCount, difficulty, conversationId })
                        });
                        window.dispatchEvent(new Event('refreshSidebar'));
                        onNavigate(`quiz&quizId=${response.quiz.id}`);
                    }}
                    disabled={isGenerating}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                    {isGenerating ? (
                        <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating...
                        </>
                    ) : (
                        "Take Practice Quiz"
                    )}
                </button>
            ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                        onClick={() => onNavigate(`quiz&quizId=${existingQuiz.id}`)}
                        className="w-full flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                    >
                        View Results
                    </button>
                    <button 
                        onClick={async () => {
                            setIsGenerating(true);
                            await ensureCsrfToken();
                            const response = await apiFetch<{ quiz: { id: number } }>(`/quizzes/${existingQuiz.id}/reset`, {
                                method: "POST"
                            });
                            setIsGenerating(false);
                            window.dispatchEvent(new Event('refreshSidebar'));
                            onNavigate(`quiz&quizId=${response.quiz.id}`);
                        }}
                        disabled={isGenerating}
                        className="w-full flex-1 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isGenerating ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Retake"}
                    </button>
                </div>
            )}
        </div>
    );
}
