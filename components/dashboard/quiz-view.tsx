"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { apiFetch, ensureCsrfToken } from "@/lib/api";
import { ListChecksIcon } from "../icons/dashboard-icons";
import type { Quiz } from "@/types/dashboard";

type QuizQuestion = {
    id: number;
    questionText: string;
    options: Array<{ id: number, optionText: string }>;
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

    // New Quiz Form State
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [topic, setTopic] = useState("");
    const [questionCount, setQuestionCount] = useState(5);

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
        window.dispatchEvent(new Event('refreshSidebar')); // Trigger sidebar refresh
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
            // Populate selectedAnswers from the saved answers in the quiz questions
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

    const retakeQuiz = async (topic: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setLoading(true);
        await ensureCsrfToken();
        const data = await apiFetch<{ quiz: FullQuiz }>("/quizzes", {
            method: "POST",
            body: JSON.stringify({ quizTopic: topic, questionCount: 5 })
        });
        await fetchQuizzes();
        setActiveQuiz(data.quiz);
        setLoading(false);
        setIsProcessing(false);
        router.push(`${pathname}?view=quiz&quizId=${data.quiz.id}`);
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
        
        // Final validation
        const unansweredCount = activeQuiz.questions.length - Object.keys(selectedAnswers).length;
        if (unansweredCount > 0) {
            alert(`Please answer all questions before submitting. You have ${unansweredCount} remaining.`);
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
            fetchQuizzes();
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
                    <h1 className="text-2xl font-black text-white mb-6">Create New Quiz</h1>
                    <div className="bg-slate-900 rounded-3xl p-8 border border-white/5 space-y-4">
                        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic..." className="w-full bg-slate-800 p-4 rounded-xl text-white"/>
                        
                        <div className="space-y-2">
                           <label className="block text-slate-400 font-bold text-sm">Questions: {questionCount}</label>
                           <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value={questionCount} 
                                onChange={e => setQuestionCount(parseInt(e.target.value))} 
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => {setShowCreateForm(false); router.replace(`${pathname}?view=quiz`)}} disabled={isProcessing} className="flex-1 p-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700">Cancel</button>
                            <button onClick={createQuiz} disabled={isProcessing} className="flex-1 p-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500">Create</button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-2xl mx-auto p-8 space-y-8">
                <button onClick={() => setShowCreateForm(true)} className="w-full p-6 rounded-2xl bg-indigo-600 text-white font-black text-xl hover:bg-indigo-500 transition-all">Create New Quiz +</button>
                <div>
                    <h1 className="text-xl font-black text-white mb-4">Pending Quizzes</h1>
                    <div className="space-y-3">
                        {pending.length === 0 && <p className="text-slate-500">No pending quizzes.</p>}
                        {pending.map(q => (
                            <div key={q.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-900 border border-white/5 text-white">
                                <span className="font-bold">{q.quizTopic}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => loadQuiz(q.id)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-bold hover:bg-indigo-500">Take Now</button>
                                    <button onClick={() => deleteQuiz(q.id)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-red-900/20 text-red-400 text-sm font-bold hover:bg-red-900/30">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h1 className="text-xl font-black text-white mb-4">Completed Quizzes</h1>
                    <div className="space-y-3">
                        {completed.length === 0 && <p className="text-slate-500">No completed quizzes.</p>}
                        {completed.map(q => (
                            <div key={q.id} className="flex justify-between items-center p-5 rounded-2xl bg-slate-900 border border-white/5 text-white">
                                <div>
                                    <p className="font-bold">{q.quizTopic}</p>
                                    <p className="text-sm text-slate-400">Score: {q.score}%</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => loadQuiz(q.id)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500">View Results</button>
                                    <button onClick={() => retakeQuiz(q.quizTopic)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-slate-700">Retake</button>
                                    <button onClick={() => deleteQuiz(q.id)} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-red-900/20 text-red-400 text-sm font-bold hover:bg-red-900/30">Delete</button>
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
    const isAllAnswered = answeredCount === totalQuestions;

    const handleBack = () => {
        setActiveQuiz(null);
        setShowCreateForm(false);
        router.replace(`${pathname}?view=quiz`);
    };

    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={handleBack} disabled={isProcessing} className="text-slate-400 hover:text-white">← Back</button>
                <h1 className="text-2xl font-black text-white">{quizToDisplay.quizTopic}</h1>
                {submissionResult && <span className="ml-auto text-xl font-black text-indigo-400">Score: {submissionResult.score}%</span>}
            </div>

            {/* Progress Bar */}
            {!submissionResult && (
                <div className="mb-8 space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        <span>Completion</span>
                        <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-700 ease-out" 
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
                                    currentQuestionIdx === i ? "bg-white w-6" : 
                                    selectedAnswers[q.id] ? "bg-indigo-500" : "bg-slate-800"
                                ].join(" ")}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-3xl border border-white/5 bg-slate-900 p-8 shadow-xl flex flex-col min-h-[400px]">
                <div className="flex-grow">
                    <h2 className="text-lg font-bold text-white mb-6">
                        {currentQuestionIdx + 1}. {question.questionText}
                    </h2>
                    
                    <div className="space-y-3">
                        {question.options.map((option) => {
                            const isSelected = selectedAnswers[question.id] === option.id;
                            const isCorrect = option.isCorrect;
                            
                            let baseClasses = "w-full text-left px-5 py-4 rounded-xl border transition-all font-medium";
                            let stateClasses = "bg-slate-800 border-white/5 text-slate-200 hover:border-indigo-500";

                            if (submissionResult) {
                                if (isCorrect) {
                                    stateClasses = "border-green-500/50 bg-green-900/20 text-green-100";
                                } else if (isSelected && !isCorrect) {
                                    stateClasses = "border-red-500/50 bg-red-900/20 text-red-100";
                                } else {
                                    stateClasses = "bg-slate-900/50 border-white/5 text-slate-600";
                                }
                            } else if (isSelected) {
                                stateClasses = "bg-indigo-600 border-indigo-500 text-white";
                            }

                            return (
                                <button 
                                    key={option.id} 
                                    onClick={() => handleOptionClick(question.id, option.id)}
                                    disabled={!!submissionResult || isProcessing}
                                    className={`${baseClasses} ${stateClasses}`}
                                >
                                    {option.optionText}
                                    {submissionResult && isCorrect && <span className="float-right font-black">✓</span>}
                                    {submissionResult && isSelected && !isCorrect && <span className="float-right font-black">✕</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 flex justify-between border-t border-white/5 pt-8">
                    <button 
                        disabled={currentQuestionIdx === 0 || isProcessing} 
                        onClick={() => setCurrentQuestionIdx(p => p - 1)}
                        className="px-6 py-2 rounded-lg bg-slate-800 text-slate-400 disabled:opacity-50 hover:bg-slate-700 transition-colors"
                    >
                        Previous
                    </button>
                    {submissionResult && currentQuestionIdx === quizToDisplay.questions.length - 1 ? (
                        <button 
                            onClick={() => { setActiveQuiz(null); router.replace(`${pathname}?view=quiz`) }}
                            disabled={isProcessing}
                            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors"
                        >
                            Back to Quiz List
                        </button>
                    ) : (
                        <button 
                            disabled={(!submissionResult && !selectedAnswers[question.id] && currentQuestionIdx !== quizToDisplay.questions.length - 1) || isProcessing}
                            onClick={() => currentQuestionIdx === quizToDisplay.questions.length - 1 ? submitQuiz() : setCurrentQuestionIdx(p => p + 1)}
                            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                            {currentQuestionIdx === quizToDisplay.questions.length - 1 ? "Submit" : "Next"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
