"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { apiFetch, ensureCsrfToken } from "@/lib/api";
import type { Quiz } from "@/types/dashboard";

type QuizQuestion = {
    id: number;
    questionText: string;
    options: Array<{ id: number, optionText: string, isCorrect: boolean }>;
    selectedOptionId?: number | null;
    answer?: { selectedOptionId: number; isCorrect: boolean } | null;
};

type FullQuiz = Quiz & { questions: QuizQuestion[] };

export function QuizView() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [activeQuiz, setActiveQuiz] = useState<FullQuiz | null>(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [submissionResult, setSubmissionResult] = useState<FullQuiz | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [topicFilter, setTopicFilter] = useState("");

    // New Quiz Form State
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [topic, setTopic] = useState("");
    const [questionCount, setQuestionCount] = useState(5);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const topicParam = searchParams.get("topic");
        const quizIdParam = searchParams.get("quizId");
        
        console.log("DEBUG QuizView useEffect:", { topicParam, quizIdParam });

        if (quizIdParam) {
            loadQuiz(parseInt(quizIdParam));
        } else if (topicParam) {
            setTopic(topicParam);
            setShowCreateForm(true);
            setLoading(false); // Ensure loading is disabled if we are going straight to form
        } else {
            fetchQuizzes();
        }
    }, [searchParams]);

    const fetchQuizzes = async () => {
        setLoading(true);
        const data = await apiFetch<{ quizzes: Quiz[] }>("/quizzes");
        setQuizzes(data.quizzes);
        setLoading(false);
    };

    const createQuiz = async () => {
        if (!topic.trim()) {
            setToast("Please enter a topic for the quiz.");
            return;
        }
        if (isProcessing) return;
        setIsProcessing(true);
        setLoading(true);
        await ensureCsrfToken();
        const data = await apiFetch<{ quiz: FullQuiz }>("/quizzes", {
            method: "POST",
            body: JSON.stringify({ quizTopic: topic, questionCount, difficulty })
        });
        await fetchQuizzes();
        window.dispatchEvent(new Event('refreshSidebar'));
        setShowCreateForm(false);
        setActiveQuiz(data.quiz);
        setTopic("");
        setQuestionCount(5);
        setDifficulty('medium');
        setLoading(false);
        setIsProcessing(false);
        router.push(`${pathname}?view=quiz&quizId=${data.quiz.id}`);
    };

    const loadQuiz = async (quizId: number) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setLoading(true);
        const data = await apiFetch<{ quiz: FullQuiz }>("/quizzes/" + quizId);
        setActiveQuiz(data.quiz);
        
        if (data.quiz.state === 'COMPLETED') {
            setSubmissionResult(data.quiz);
            const initialAnswers: Record<number, number> = {};
            data.quiz.questions.forEach(q => {
                if (q.selectedOptionId) {
                    initialAnswers[q.id] = q.selectedOptionId;
                }
            });
            setSelectedAnswers(initialAnswers);
        } else {
            setSubmissionResult(null);
            setSelectedAnswers({});
        }

        setCurrentQuestionIdx(0);
        setLoading(false);
        setIsProcessing(false);
    };

    const retakeQuiz = async (quizId: number) => {
        if (isProcessing) {
            setToast("A quiz is already being processed...");
            return;
        }
        
        setIsProcessing(true);
        setLoading(true);
        setToast("Resetting quiz...");
        
        await ensureCsrfToken();
        try {
            const data = await apiFetch<{ quiz: FullQuiz }>(`/quizzes/${quizId}/reset`, {
                method: "POST"
            });
            await fetchQuizzes();
            window.dispatchEvent(new Event('refreshSidebar'));
            setActiveQuiz(data.quiz);
            setLoading(false);
            setIsProcessing(false);
            setToast("Quiz reset!");
            router.push(`${pathname}?view=quiz&quizId=${data.quiz.id}`);
        } catch (error) {
            setIsProcessing(false);
            setLoading(false);
            setToast("Failed to reset quiz. Please try again.");
        }
    };

    const deleteQuiz = async (quizId: number) => {
        if (isProcessing) return;
        setIsProcessing(true);
        await ensureCsrfToken();
        await apiFetch(`/quizzes/${quizId}`, { method: "DELETE" });
        await fetchQuizzes();
        window.dispatchEvent(new Event('refreshSidebar'));
        setIsProcessing(false);
    };

    const handleOptionClick = (questionId: number, optionId: number) => {
        if (submissionResult) return;
        setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const submitQuiz = async () => {
        if (!activeQuiz || isProcessing) return;
        
        const unansweredCount = activeQuiz.questions.length - Object.keys(selectedAnswers).length;
        if (unansweredCount > 0) {
            setToast(`Please answer ${unansweredCount} more question${unansweredCount === 1 ? '' : 's'}.`);
            return;
        }

        setIsProcessing(true);
        const answers = Object.entries(selectedAnswers).map(([qId, oId]) => ({
            quizQuestionId: parseInt(qId),
            selectedOptionId: oId
        }));
        await ensureCsrfToken();
        try {
            const data = await apiFetch<{ quiz: FullQuiz }>("/quizzes/" + activeQuiz.id + "/submit", {
                method: "POST",
                body: JSON.stringify({ answers })
            });
            setSubmissionResult(data.quiz);
            await fetchQuizzes();
            window.dispatchEvent(new Event('refreshSidebar'));
        } catch (error) {
            console.error("Quiz submission failed:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="text-slate-400 p-8">Loading...</div>;

    if (!activeQuiz) {
        const pending = quizzes.filter(q => q.state !== 'COMPLETED');
        const completed = quizzes.filter(q => q.state === 'COMPLETED');

        if (showCreateForm) {
            return (
                <div className="max-w-2xl mx-auto py-4 sm:py-8 px-4 sm:px-0">
                    {toast && (
                        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-700 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in duration-300 max-w-[calc(100vw-2rem)]">
                            {toast}
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-foreground mb-6">Create New Quiz</h1>
                    <div className="p-6 sm:p-8 rounded-2xl bg-slate-800/80 border border-indigo-500/20 shadow-lg backdrop-blur-sm space-y-6">
                        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic..." className="w-full bg-slate-900 p-4 rounded-lg text-foreground border border-slate-700 focus:border-indigo-500 outline-none"/>                        
                        
                        {/* Questions Slider */}
                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                                <label className="block text-slate-400 font-bold text-xs">Questions</label>
                                <span className="text-indigo-400 font-bold text-xs">{questionCount}</span>
                           </div>
                           <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value={questionCount} 
                                onChange={e => setQuestionCount(parseInt(e.target.value))} 
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all" 
                            />
                        </div>

                        {/* Difficulty Checklist */}
                        <div className="space-y-2">
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Difficulty</span>
                            <div className="grid grid-cols-3 gap-2">
                                {(['easy', 'medium', 'hard'] as ('easy' | 'medium' | 'hard')[]).map((d) => {
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

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                            <button onClick={() => {setShowCreateForm(false); router.replace(`${pathname}?view=quiz`)}} disabled={isProcessing} className="flex-1 p-4 rounded-lg bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 cursor-pointer order-2 sm:order-1">Cancel</button>
                            <button onClick={createQuiz} disabled={isProcessing} className="flex-1 p-4 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 cursor-pointer order-1 sm:order-2">Create Quiz</button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-2xl mx-auto py-4 sm:py-8 space-y-8">
                <button onClick={() => setShowCreateForm(true)} className="w-full p-6 rounded-xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-500 transition-all shadow-lg cursor-pointer">Create New Quiz +</button>
                <div>
                    <h1 className="text-lg font-bold text-foreground mb-4">Pending Quizzes</h1>
                    <div className="space-y-3">
                        {pending.length === 0 && <p className="text-slate-500 text-sm">No pending quizzes.</p>}
                        {pending.map(q => (
                            <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-foreground gap-4">
                                <span className="font-medium truncate">{q.quizTopic}</span>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={() => loadQuiz(q.id)} disabled={isProcessing} className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 cursor-pointer">Take Now</button>
                                    <button onClick={() => deleteQuiz(q.id)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/30 cursor-pointer">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                        <h1 className="text-lg font-bold text-foreground">Completed Quizzes</h1>
                        <div className="relative w-full sm:w-auto">
                            <input 
                                placeholder="Filter topics..." 
                                value={topicFilter} 
                                onChange={e => setTopicFilter(e.target.value)} 
                                className="w-full sm:w-48 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm text-foreground border border-slate-200 dark:border-slate-700"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {completed.filter(q => q.quizTopic.toLowerCase().includes(topicFilter.toLowerCase())).length === 0 && (
                            <p className="text-slate-500 text-sm italic">No matching completed quizzes found.</p>
                        )}
                        {completed.filter(q => q.quizTopic.toLowerCase().includes(topicFilter.toLowerCase())).map(q => (
                            <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between group transition-shadow hover:shadow-sm gap-4">
                                <div className="space-y-1 flex-1 min-w-0">
                                    <p className="font-semibold text-foreground truncate">{q.quizTopic}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                        <span>Score: <strong className={Number(q.score) >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>{q.score}%</strong></span>
                                        <span>Completed: {new Date(q.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => loadQuiz(q.id)} disabled={isProcessing} className="flex-1 md:flex-initial px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer">Review</button>
                                    <button onClick={() => retakeQuiz(q.id)} disabled={isProcessing} className="flex-1 md:flex-initial px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-foreground text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">Retake</button>
                                    <button onClick={() => deleteQuiz(q.id)} disabled={isProcessing} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const quizToDisplay = submissionResult || activeQuiz;
    const question = quizToDisplay.questions[currentQuestionIdx];
    const totalQuestions = quizToDisplay.questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;

    const handleBack = () => {
        setActiveQuiz(null);
        setShowCreateForm(false);
        router.replace(`${pathname}?view=quiz`);
    };

    return (
        <div className="max-w-2xl mx-auto py-4 sm:py-8">
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-700 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in duration-300 max-w-[calc(100vw-2rem)]">
                    {toast}
                </div>
            )}
            
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button onClick={handleBack} disabled={isProcessing} className="text-slate-500 hover:text-foreground cursor-pointer flex-shrink-0">← Back</button>
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{quizToDisplay.quizTopic}</h1>
                {submissionResult && <span className="ml-auto text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{submissionResult.score}%</span>}
            </div>

            {/* Question Navigation Dots */}
            <div className="mb-8 space-y-3 sm:space-y-4">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    <span>Question {currentQuestionIdx + 1} of {totalQuestions}</span>
                    {submissionResult ? (
                        <span>Review Mode</span>
                    ) : (
                        <span>{Math.round((answeredCount / totalQuestions) * 100)}% Complete</span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {quizToDisplay.questions.map((q, i) => {
                        const isCurrent = currentQuestionIdx === i;
                        let stateClasses = "border-slate-600 bg-slate-800 text-slate-400";
                        
                        if (submissionResult) {
                            const isCorrect = q.options.find(o => o.id === selectedAnswers[q.id])?.isCorrect;
                            stateClasses = isCorrect 
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                : "border-red-500/50 bg-red-500/10 text-red-400";
                        } else if (selectedAnswers[q.id] !== undefined) {
                            stateClasses = "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
                        }

                        return (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQuestionIdx(i)}
                                className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer border-2 ${
                                    isCurrent 
                                        ? "border-indigo-400 bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105" 
                                        : stateClasses
                                }`}
                            >
                                {i + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-lg flex flex-col min-h-[350px] sm:min-h-[400px]">
                <div className="flex-grow">
                    <h2 className="text-base sm:text-lg font-semibold text-foreground mb-6">
                        {currentQuestionIdx + 1}. {question.questionText}
                    </h2>
                    
                    <div className="space-y-3">
                        {question.options.map((option) => {
                            const isSelected = selectedAnswers[question.id] === option.id;
                            const isCorrect = option.isCorrect;
                            
                            let baseClasses = "w-full text-left px-4 sm:px-5 py-3 rounded-lg border transition-all font-medium text-sm cursor-pointer";
                            let stateClasses = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-foreground hover:border-indigo-400";

                            if (submissionResult) {
                                if (isCorrect) {
                                    stateClasses = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-100";
                                } else if (isSelected && !isCorrect) {
                                    stateClasses = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-100";
                                } else {
                                    stateClasses = "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-500";
                                }
                            } else if (isSelected) {
                                stateClasses = "bg-indigo-600 border-indigo-600 text-white";
                            }

                            return (
                                <button 
                                    key={option.id} 
                                    onClick={() => handleOptionClick(question.id, option.id)}
                                    disabled={!!submissionResult || isProcessing}
                                    className={`${baseClasses} ${stateClasses} flex justify-between items-center`}
                                >
                                    <span className="flex-1 pr-2">{option.optionText}</span>
                                    {submissionResult && isCorrect && <span className="font-bold flex-shrink-0">✓</span>}
                                    {submissionResult && isSelected && !isCorrect && <span className="font-bold flex-shrink-0">✕</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 flex justify-between border-t border-slate-200 dark:border-slate-800 pt-6 sm:pt-8 gap-3 sm:gap-4">
                    <button 
                        disabled={currentQuestionIdx === 0 || isProcessing} 
                        onClick={() => setCurrentQuestionIdx(p => p - 1)}
                        className="px-4 sm:px-6 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-sm shadow-sm cursor-pointer"
                    >
                        Previous
                    </button>
                    {submissionResult && currentQuestionIdx === quizToDisplay.questions.length - 1 ? (
                        <button 
                            onClick={() => { setActiveQuiz(null); router.replace(`${pathname}?view=quiz`) }}
                            disabled={isProcessing}
                            className="px-4 sm:px-6 py-2.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-semibold hover:bg-slate-900 dark:hover:bg-slate-600 transition-all text-sm shadow-sm cursor-pointer"
                        >
                            Done
                        </button>
                    ) : (
                        <button 
                            disabled={(!submissionResult && !selectedAnswers[question.id] && currentQuestionIdx !== quizToDisplay.questions.length - 1) || isProcessing}
                            onClick={() => currentQuestionIdx === quizToDisplay.questions.length - 1 ? submitQuiz() : setCurrentQuestionIdx(p => p + 1)}
                            className="px-4 sm:px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all text-sm shadow-lg disabled:opacity-50 cursor-pointer"
                        >
                            {currentQuestionIdx === quizToDisplay.questions.length - 1 ? "Submit" : "Next"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
