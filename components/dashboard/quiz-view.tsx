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
        
        if (quizIdParam) {
            loadQuiz(parseInt(quizIdParam));
        } else if (topicParam) {
            setTopic(topicParam);
            setShowCreateForm(true);
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
        if (!topic.trim() || isProcessing) return;
        setIsProcessing(true);
        setLoading(true);
        await ensureCsrfToken();
        const data = await apiFetch<{ quiz: FullQuiz }>("/quizzes", {
            method: "POST",
            body: JSON.stringify({ quizTopic: topic, questionCount })
        });
        await fetchQuizzes();
        window.dispatchEvent(new Event('refreshSidebar'));
        setShowCreateForm(false);
        setActiveQuiz(data.quiz);
        setTopic("");
        setQuestionCount(5);
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

    const retakeQuiz = async (topic: string, conversationId?: number) => {
        console.log("Retake clicked:", { topic, conversationId });
        if (isProcessing) return;
        setIsProcessing(true);
        setLoading(true);
        await ensureCsrfToken();
        try {
            const body: any = { quizTopic: topic, questionCount: 5 };
            if (conversationId !== undefined && conversationId !== null) {
                body.conversationId = Number(conversationId);
            }
            
            const data = await apiFetch<{ quiz: FullQuiz }>("/quizzes", {
                method: "POST",
                body: JSON.stringify(body)
            });
            console.log("Retake successful:", data);
            await fetchQuizzes();
            window.dispatchEvent(new Event('refreshSidebar'));
            setActiveQuiz(data.quiz);
            setLoading(false);
            setIsProcessing(false);
            router.push(`${pathname}?view=quiz&quizId=${data.quiz.id}`);
        } catch (error) {
            console.error("Retake failed:", error);
            setIsProcessing(false);
            setLoading(false);
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
                <div className="max-w-2xl mx-auto p-8">
                    <h1 className="text-2xl font-bold text-foreground mb-6">Create New Quiz</h1>
                    <div className="pro-card p-8 space-y-4">
                        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic..." className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-foreground border border-slate-200 dark:border-slate-700"/>
                        
                        <div className="space-y-2">
                           <label className="block text-slate-500 font-bold text-sm">Questions: {questionCount}</label>
                           <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value={questionCount} 
                                onChange={e => setQuestionCount(parseInt(e.target.value))} 
                                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => {setShowCreateForm(false); router.replace(`${pathname}?view=quiz`)}} disabled={isProcessing} className="flex-1 p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-foreground font-bold hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
                            <button onClick={createQuiz} disabled={isProcessing} className="flex-1 p-4 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500">Create</button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-2xl mx-auto p-8 space-y-8">
                <button onClick={() => setShowCreateForm(true)} className="w-full p-6 rounded-xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-500 transition-all shadow-premium">Create New Quiz +</button>
                <div>
                    <h1 className="text-lg font-bold text-foreground mb-4">Pending Quizzes</h1>
                    <div className="space-y-3">
                        {pending.length === 0 && <p className="text-slate-500 text-sm">No pending quizzes.</p>}
                        {pending.map(q => (
                            <div key={q.id} className="flex items-center justify-between p-5 rounded-xl pro-card text-foreground">
                                <span className="font-medium">{q.quizTopic}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => loadQuiz(q.id)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500">Take Now</button>
                                    <button onClick={() => deleteQuiz(q.id)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/30">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-lg font-bold text-foreground">Completed Quizzes</h1>
                        <input 
                            placeholder="Filter by topic..." 
                            value={topicFilter} 
                            onChange={e => setTopicFilter(e.target.value)} 
                            className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm text-foreground border border-slate-200 dark:border-slate-700"
                        />
                    </div>
                    <div className="space-y-4">
                        {completed.filter(q => q.quizTopic.toLowerCase().includes(topicFilter.toLowerCase())).length === 0 && (
                            <p className="text-slate-500 text-sm italic">No matching completed quizzes found.</p>
                        )}
                        {completed.filter(q => q.quizTopic.toLowerCase().includes(topicFilter.toLowerCase())).map(q => (
                            <div key={q.id} className="pro-card p-6 flex justify-between items-center group transition-shadow hover:shadow-soft">
                                <div className="space-y-1">
                                    <p className="font-semibold text-foreground">{q.quizTopic}</p>
                                    <div className="flex gap-4 text-xs text-slate-500">
                                        <span>Score: <strong className={Number(q.score) >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>{q.score}%</strong></span>
                                        <span>Completed: {new Date(q.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => loadQuiz(q.id)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">Review</button>
                                    <button onClick={() => retakeQuiz(q.quizTopic, q.conversationId)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-foreground text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Retake</button>
                                    <button onClick={() => deleteQuiz(q.id)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">Delete</button>
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
        <div className="max-w-2xl mx-auto p-8">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-700 text-white px-6 py-3 rounded-lg shadow-premium animate-fade-in">
                    {toast}
                </div>
            )}
            
            <div className="flex items-center gap-4 mb-8">
                <button onClick={handleBack} disabled={isProcessing} className="text-slate-500 hover:text-foreground">← Back</button>
                <h1 className="text-xl font-bold text-foreground">{quizToDisplay.quizTopic}</h1>
                {submissionResult && <span className="ml-auto text-lg font-bold text-indigo-600 dark:text-indigo-400">Score: {submissionResult.score}%</span>}
            </div>

            {/* Progress Bar */}
            {!submissionResult && (
                <div className="mb-8 space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                        <span>Completion</span>
                        <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-600 transition-all duration-300 ease-out" 
                            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                        />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                        {quizToDisplay.questions.map((q, i) => (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQuestionIdx(i)}
                                className={[
                                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                                    currentQuestionIdx === i ? "bg-foreground w-6" : 
                                    selectedAnswers[q.id] ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                                ].join(" ")}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="pro-card p-8 shadow-premium flex flex-col min-h-[400px]">
                <div className="flex-grow">
                    <h2 className="text-lg font-semibold text-foreground mb-6">
                        {currentQuestionIdx + 1}. {question.questionText}
                    </h2>
                    
                    <div className="space-y-3">
                        {question.options.map((option) => {
                            const isSelected = selectedAnswers[question.id] === option.id;
                            const isCorrect = option.isCorrect;
                            
                            let baseClasses = "w-full text-left px-5 py-3 rounded-lg border transition-all font-medium text-sm";
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
                                    className={`${baseClasses} ${stateClasses}`}
                                >
                                    {option.optionText}
                                    {submissionResult && isCorrect && <span className="float-right font-bold">✓</span>}
                                    {submissionResult && isSelected && !isCorrect && <span className="float-right font-bold">✕</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 flex justify-between border-t border-slate-200 dark:border-slate-800 pt-8 gap-4">
                    <button 
                        disabled={currentQuestionIdx === 0 || isProcessing} 
                        onClick={() => setCurrentQuestionIdx(p => p - 1)}
                        className="px-6 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-sm shadow-soft"
                    >
                        Previous
                    </button>
                    {submissionResult && currentQuestionIdx === quizToDisplay.questions.length - 1 ? (
                        <button 
                            onClick={() => { setActiveQuiz(null); router.replace(`${pathname}?view=quiz`) }}
                            disabled={isProcessing}
                            className="px-6 py-2.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-semibold hover:bg-slate-900 dark:hover:bg-slate-600 transition-all text-sm shadow-soft"
                        >
                            Back to List
                        </button>
                    ) : (
                        <button 
                            disabled={(!submissionResult && !selectedAnswers[question.id] && currentQuestionIdx !== quizToDisplay.questions.length - 1) || isProcessing}
                            onClick={() => currentQuestionIdx === quizToDisplay.questions.length - 1 ? submitQuiz() : setCurrentQuestionIdx(p => p + 1)}
                            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all text-sm shadow-premium disabled:opacity-50"
                        >
                            {currentQuestionIdx === quizToDisplay.questions.length - 1 ? "Submit" : "Next"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
