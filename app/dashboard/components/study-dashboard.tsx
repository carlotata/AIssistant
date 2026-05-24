"use client";

import { useEffect, useState } from "react";

import { apiFetch, ApiError, ensureCsrfToken } from "@/lib/api";
import { createInitialMessages, DASHBOARD_TABS, QUICK_ACTIONS } from "./hard-data/dashboard-data";
import { AssistantChatPanel } from "./assistant-chat-panel";
import { DashboardHeader } from "./dashboard-header";
import { ChatIcon, ListChecksIcon, TrendUpIcon } from "./dashboard-icons";
import type { ChatMessage, DashboardSummary, QuickAction, Quiz, StudyProgress, StudyQuestion } from "./hard-data/dashboard-types";

function createMessageId() {
   return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value: string) {
   return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
   }).format(new Date(value));
}

function averageScoreLabel(score: number) {
   return `${Math.round(score)}%`;
}

function EmptyState({ children }: { children: React.ReactNode }) {
   return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center transition-all duration-300 hover:bg-slate-50">
         <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
            <SparklesIcon className="h-8 w-8 opacity-20" />
         </div>
         <p className="text-sm font-semibold text-slate-500">{children}</p>
      </div>
   );
}

function SectionPanel({ children, className = "" }: { children: React.ReactNode, className?: string }) {
   return (
      <section className={`rounded-[2rem] border border-slate-200/60 bg-white p-8 shadow-premium transition-all duration-300 hover:shadow-xl animate-fade-in-up ${className}`}>
         {children}
      </section>
   );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
   return (
      <div className="group flex min-h-24 min-w-0 flex-col items-start justify-between gap-4 rounded-[1.5rem] border border-slate-200/50 bg-white p-6 shadow-soft transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 hover:shadow-premium sm:flex-row sm:items-center">
         <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-600 transition-colors group-hover:from-blue-600 group-hover:to-indigo-500 group-hover:text-white shadow-inner">
            {icon ?? <TrendUpIcon className="h-7 w-7" />}
         </div>
         <div className="min-w-0 sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-3xl font-black tabular-nums text-slate-900">{value}</p>
         </div>
      </div>
   );
}

function ProgressCards({ progress }: { progress: StudyProgress }) {
   return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
         <Metric label="Topics Mastered" value={progress.completedTopics.toString()} icon={<ChatIcon className="h-7 w-7" />} />
         <Metric label="Quizzes Taken" value={progress.totalQuizzes.toString()} icon={<ListChecksIcon className="h-7 w-7" />} />
         <Metric label="Avg Accuracy" value={averageScoreLabel(progress.averageScore)} />
      </div>
   );
}

function ProgressPanel({ progress }: { progress: StudyProgress }) {
   return (
      <SectionPanel>
         <div className="mb-8 flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
               <TrendUpIcon className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Study Progress</h2>
         </div>

         <ProgressCards progress={progress} />

         <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/50 p-5">
            <div className="flex items-center gap-4">
               <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                  <div 
                     className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000" 
                     style={{ width: `${Math.max(15, progress.averageScore)}%` }}
                  />
               </div>
               <span className="text-sm font-bold text-blue-700">{averageScoreLabel(progress.averageScore)}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">
               {progress.totalQuizzes > 0
                  ? `Excellent work! You've tackled ${progress.totalQuizzes} quizzes. Keep pushing that average score higher.`
                  : "Start your journey by generating your first quiz below."}
            </p>
         </div>
      </SectionPanel>
   );
}

function QuestionsPanel({ questions, title }: { questions: StudyQuestion[]; title: string }) {
   return (
      <SectionPanel>
         <div className="mb-8 flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
               <ChatIcon className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
         </div>

         {questions.length === 0 ? (
            <EmptyState>Ask a study question to save your first answer.</EmptyState>
         ) : (
            <div className="grid gap-4">
               {questions.map((question) => (
                  <article key={question.id} className="group relative rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:bg-white hover:shadow-premium">
                     <p className="text-sm font-bold text-slate-900 line-clamp-1">{question.questionText}</p>
                     <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{question.chatbotResponse}</p>
                     <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{formatDate(question.createdAt)}</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                  </article>
               ))}
            </div>
         )}
      </SectionPanel>
   );
}

function QuizzesPanel({
   quizzes,
   onSelectQuiz,
   title,
}: {
   quizzes: Quiz[];
   onSelectQuiz: (quizId: number) => void;
   title: string;
}) {
   return (
      <SectionPanel>
         <div className="mb-8 flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
               <ListChecksIcon className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
         </div>

         {quizzes.length === 0 ? (
            <EmptyState>Generated quizzes will appear here.</EmptyState>
         ) : (
            <div className="grid gap-4">
               {quizzes.map((quiz) => (
                  <button
                     key={quiz.id}
                     type="button"
                     onClick={() => onSelectQuiz(quiz.id)}
                     className="group block w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-left transition-all hover:border-blue-200 hover:bg-white hover:shadow-premium">
                     <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                           <p className="text-sm font-bold text-slate-900 truncate">{quiz.quizTopic}</p>
                           <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{formatDate(quiz.createdAt)}</p>
                        </div>
                        <span
                           className={[
                              "shrink-0 rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm",
                              quiz.state === "COMPLETED"
                                 ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                                 : "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
                           ].join(" ")}>
                           {quiz.state === "COMPLETED" ? `Score: ${averageScoreLabel(quiz.score ?? 0)}` : "Start Quiz"}
                        </span>
                     </div>
                  </button>
               ))}
            </div>
         )}
      </SectionPanel>
   );
}

function DashboardSkeleton() {
   return (
      <div className="grid gap-6">
         <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
               <div key={i} className="h-32 animate-pulse rounded-[1.5rem] bg-white shadow-soft" />
            ))}
         </div>
         <div className="h-64 animate-pulse rounded-[2rem] bg-white shadow-premium" />
         <div className="h-96 animate-pulse rounded-[2rem] bg-white shadow-premium" />
      </div>
   );
}

export function StudyDashboard() {
   const [activeTabId, setActiveTabId] = useState("dashboard");
   const [summary, setSummary] = useState<DashboardSummary | null>(null);
   const [loadingSummary, setLoadingSummary] = useState(true);
   const [summaryError, setSummaryError] = useState<string | null>(null);
   const [allQuestions, setAllQuestions] = useState<StudyQuestion[]>([]);
   const [questionsLoading, setQuestionsLoading] = useState(false);
   const [questionsError, setQuestionsError] = useState<string | null>(null);
   const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
   const [quizzesLoading, setQuizzesLoading] = useState(false);
   const [quizzesError, setQuizzesError] = useState<string | null>(null);
   const [progress, setProgress] = useState<StudyProgress | null>(null);
   const [progressLoading, setProgressLoading] = useState(false);
   const [progressError, setProgressError] = useState<string | null>(null);
   const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
   const [inputValue, setInputValue] = useState("");
   const [submitting, setSubmitting] = useState(false);
   const [quizTopic, setQuizTopic] = useState("");
   const [quizQuestionCount, setQuizQuestionCount] = useState(5);
   const [quizLoading, setQuizLoading] = useState(false);
   const [quizError, setQuizError] = useState<string | null>(null);
   const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
   const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

   async function loadSummary() {
      setSummaryError(null);
      try {
         const data = await apiFetch<DashboardSummary>("/dashboard/summary");
         setSummary(data);
         setProgress(data.studyProgress);
      } catch (err) {
         if (err instanceof ApiError) {
            setSummaryError(err.message);
         } else {
            setSummaryError("Could not load your dashboard.");
         }
      } finally {
         setLoadingSummary(false);
      }
   }

   async function loadQuestions() {
      setQuestionsError(null);
      setQuestionsLoading(true);
      try {
         const data = await apiFetch<{ studyQuestions: StudyQuestion[] }>("/study-questions");
         setAllQuestions(data.studyQuestions);
      } catch (err) {
         setQuestionsError(err instanceof ApiError ? err.message : "Could not load your questions.");
      } finally {
         setQuestionsLoading(false);
      }
   }

   async function loadQuizzes() {
      setQuizzesError(null);
      setQuizzesLoading(true);
      try {
         const data = await apiFetch<{ quizzes: Quiz[] }>("/quizzes");
         setAllQuizzes(data.quizzes);
      } catch (err) {
         setQuizzesError(err instanceof ApiError ? err.message : "Could not load your quizzes.");
      } finally {
         setQuizzesLoading(false);
      }
   }

   async function loadProgress() {
      setProgressError(null);
      setProgressLoading(true);
      try {
         const data = await apiFetch<{ studyProgress: StudyProgress }>("/study-progress");
         setProgress(data.studyProgress);
      } catch (err) {
         setProgressError(err instanceof ApiError ? err.message : "Could not load your progress.");
      } finally {
         setProgressLoading(false);
      }
   }

   useEffect(() => {
      void Promise.resolve()
         .then(() => ensureCsrfToken())
         .then(() => loadSummary());
   }, []);

   async function openQuiz(quizId: number) {
      setQuizError(null);
      setQuizLoading(true);
      try {
         const data = await apiFetch<{ quiz: Quiz }>(`/quizzes/${quizId}`);
         setActiveQuiz(data.quiz);
         setSelectedAnswers(
            Object.fromEntries(
               (data.quiz.questions ?? [])
                  .filter((question) => question.selectedOptionId !== null)
                  .map((question) => [question.id, question.selectedOptionId as number]),
            ),
         );
         setActiveTabId("quizzes");
         await loadQuizzes();
      } catch (err) {
         setQuizError(err instanceof ApiError ? err.message : "Could not open this quiz.");
      } finally {
         setQuizLoading(false);
      }
   }

   async function createQuiz(topic: string) {
      const cleanedTopic = topic.trim();
      if (!cleanedTopic || quizLoading) {
         return;
      }

      setQuizError(null);
      setQuizLoading(true);
      try {
         const data = await apiFetch<{ quiz: Quiz }>("/quizzes", {
            method: "POST",
            body: JSON.stringify({ quizTopic: cleanedTopic, questionCount: quizQuestionCount }),
         });
         setActiveQuiz(data.quiz);
         setSelectedAnswers({});
         setQuizTopic("");
         setActiveTabId("quizzes");
         await loadSummary();
         await loadQuizzes();
      } catch (err) {
         setQuizError(err instanceof ApiError ? err.message : "Could not create a quiz right now.");
      } finally {
         setQuizLoading(false);
      }
   }

   async function submitQuiz() {
      if (!activeQuiz?.questions || quizLoading) {
         return;
      }

      const answers = activeQuiz.questions.map((question) => ({
         quizQuestionId: question.id,
         selectedOptionId: selectedAnswers[question.id],
      }));

      if (answers.some((answer) => !answer.selectedOptionId)) {
         setQuizError("Choose one option for every question before submitting.");
         return;
      }

      setQuizError(null);
      setQuizLoading(true);
      try {
         const data = await apiFetch<{ quiz: Quiz; studyProgress: StudyProgress }>(`/quizzes/${activeQuiz.id}/submit`, {
            method: "POST",
            body: JSON.stringify({ answers }),
         });
         setActiveQuiz(data.quiz);
         setProgress(data.studyProgress);
         await loadSummary();
         await loadQuizzes();
      } catch (err) {
         setQuizError(err instanceof ApiError ? err.message : "Could not submit this quiz.");
      } finally {
         setQuizLoading(false);
      }
   }

   const quizPanel = (
      <SectionPanel>
         <div className="mb-8 flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
               <ListChecksIcon className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Create Quiz</h2>
         </div>

         <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px_140px]">
            <input
               value={quizTopic}
               onChange={(event) => setQuizTopic(event.target.value)}
               placeholder="Topic (e.g. Quantum Physics, History...)"
               disabled={quizLoading}
               className="h-14 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="relative">
               <select
                  id="quiz-question-count"
                  value={quizQuestionCount}
                  onChange={(event) => setQuizQuestionCount(Number(event.target.value))}
                  disabled={quizLoading}
                  className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-black text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Quiz question count">
                  {[3, 5, 7, 10].map((count) => (
                     <option key={count} value={count}>
                        {count} Questions
                     </option>
                  ))}
               </select>
               <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
               </div>
            </div>
            <button
               type="button"
               onClick={() => createQuiz(quizTopic)}
               disabled={quizLoading || !quizTopic.trim()}
               className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-500 px-6 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:grayscale">
               {quizLoading ? "Generating..." : "Generate"}
            </button>
         </div>

         {quizError && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
               <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               {quizError}
            </div>
         )}

         {activeQuiz?.questions && (
            <div className="mt-10 space-y-6 animate-fade-in-up">
               <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Active Quiz Session</p>
                     <h3 className="mt-1 text-xl font-black text-slate-900">{activeQuiz.quizTopic}</h3>
                  </div>
                  <span className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest ${
                     activeQuiz.state === "COMPLETED" ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" : "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                  }`}>
                     {activeQuiz.state === "COMPLETED" ? `Accuracy: ${averageScoreLabel(activeQuiz.score ?? 0)}` : "In Progress"}
                  </span>
               </div>

               <div className="space-y-8">
                  {activeQuiz.questions.map((question) => (
                     <fieldset key={question.id} className="space-y-4">
                        <legend className="text-base font-bold text-slate-900">
                           <span className="mr-2 text-blue-600 opacity-50">{question.position}.</span>
                           {question.questionText}
                        </legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                           {question.options.map((option) => {
                              const isSelected = selectedAnswers[question.id] === option.id;
                              const isCompleted = activeQuiz.state === "COMPLETED";
                              const isCorrect = option.isCorrect === true;

                              return (
                                 <label
                                    key={option.id}
                                    className={[
                                       "relative flex cursor-pointer items-center gap-4 rounded-2xl border p-4 text-sm font-bold transition-all duration-200",
                                       isSelected ? "border-blue-400 bg-blue-50/30 text-slate-900 shadow-sm" : "border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50",
                                       isCompleted && isCorrect ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-500/20" : "",
                                       isCompleted && isSelected && !isCorrect ? "border-red-500 bg-red-50/50 text-red-900 ring-1 ring-red-500/20" : "",
                                    ].join(" ")}>
                                    <input
                                       type="radio"
                                       name={`question-${question.id}`}
                                       checked={isSelected}
                                       disabled={isCompleted}
                                       onChange={() =>
                                          setSelectedAnswers((prev) => ({
                                             ...prev,
                                             [question.id]: option.id,
                                          }))
                                       }
                                       className="h-5 w-5 accent-blue-600"
                                    />
                                    <span>{option.optionText}</span>
                                    {isCompleted && isCorrect && (
                                       <div className="absolute right-4 text-emerald-600">
                                          <CheckCircleIcon className="h-5 w-5" />
                                       </div>
                                    )}
                                 </label>
                              );
                           })}
                        </div>
                     </fieldset>
                  ))}
               </div>

               {activeQuiz.state !== "COMPLETED" && (
                  <button
                     type="button"
                     onClick={submitQuiz}
                     disabled={quizLoading}
                     className="mt-8 h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-500 text-sm font-black text-white shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                     Complete & See Score
                  </button>
               )}
            </div>
         )}
      </SectionPanel>
   );

   function renderVisiblePanels() {
      if (!summary) {
         return null;
      }

      if (activeTabId === "chat") {
         return (
            <div className="space-y-8">
               <AssistantChatPanel
                  messages={messages}
                  inputValue={inputValue}
                  submitting={submitting}
                  quickActions={QUICK_ACTIONS}
                  onInputChange={setInputValue}
                  onSubmitMessage={handleSubmitMessage}
                  onQuickAction={handleQuickAction}
               />
               {questionsLoading ? (
                  <DashboardSkeleton />
               ) : questionsError ? (
                  <SectionPanel>
                     <p className="text-sm font-bold text-red-500">{questionsError}</p>
                  </SectionPanel>
               ) : (
                  <QuestionsPanel title="Knowledge Bank" questions={allQuestions} />
               )}
            </div>
         );
      }

      if (activeTabId === "quizzes") {
         return (
            <div className="space-y-8">
               {quizPanel}
               {quizzesLoading ? (
                  <DashboardSkeleton />
               ) : quizzesError ? (
                  <SectionPanel>
                     <p className="text-sm font-bold text-red-500">{quizzesError}</p>
                  </SectionPanel>
               ) : (
                  <QuizzesPanel title="Quiz History" quizzes={allQuizzes} onSelectQuiz={openQuiz} />
               )}
            </div>
         );
      }

      if (activeTabId === "progress") {
         if (progressLoading) {
            return <DashboardSkeleton />;
         }

         if (progressError) {
            return (
               <SectionPanel>
                  <p className="text-sm font-bold text-red-500">{progressError}</p>
               </SectionPanel>
            );
         }

         return <ProgressPanel progress={progress ?? summary.studyProgress} />;
      }

      return (
         <div className="space-y-8">
            <ProgressCards progress={summary.studyProgress} />
            <QuestionsPanel title="Recent Insights" questions={summary.recentStudyQuestions} />
            {quizPanel}
            <QuizzesPanel title="Recent Quizzes" quizzes={summary.recentQuizzes} onSelectQuiz={openQuiz} />
         </div>
      );
   }

   async function pushChatPrompt(prompt: string) {
      const cleanedPrompt = prompt.trim();
      if (!cleanedPrompt || submitting) {
         return;
      }

      const userMessage: ChatMessage = {
         id: createMessageId(),
         role: "user",
         content: cleanedPrompt,
      };

      setMessages((prev) => [...prev, userMessage]);
      setSubmitting(true);

      try {
         const data = await apiFetch<{ studyQuestion: StudyQuestion }>("/study-questions", {
            method: "POST",
            body: JSON.stringify({ questionText: cleanedPrompt }),
         });

         setMessages((prev) => [
            ...prev,
            {
               id: createMessageId(),
               role: "assistant",
               content: data.studyQuestion.chatbotResponse,
            },
         ]);
         await loadSummary();
         await loadQuestions();
      } catch (err) {
         const content =
            err instanceof ApiError
               ? err.message
               : "The assistant could not answer right now. Please try again.";
         setMessages((prev) => [...prev, { id: createMessageId(), role: "assistant", content }]);
      } finally {
         setSubmitting(false);
      }
   }

   function handleSubmitMessage() {
      const prompt = inputValue;
      setInputValue("");
      pushChatPrompt(prompt);
   }

   function handleQuickAction(action: QuickAction) {
      setInputValue("");
      if (action.id === "action-quiz") {
         setQuizTopic(action.prompt);
         void createQuiz(action.prompt);
         return;
      }

      pushChatPrompt(action.prompt);
   }

   function handleTabChange(tabId: string) {
      setActiveTabId(tabId);

      if (tabId === "chat") {
         void loadQuestions();
      }

      if (tabId === "quizzes") {
         void loadQuizzes();
      }

      if (tabId === "progress") {
         void loadProgress();
      }
   }

   return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
         {/* Background Decor */}
         <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-blue-400/5 blur-[120px]" />
            <div className="absolute top-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-indigo-400/5 blur-[120px]" />
         </div>

         <DashboardHeader tabs={DASHBOARD_TABS} activeTabId={activeTabId} onTabChange={handleTabChange} />

         <main
            className={[
               "relative z-10 mx-auto grid w-full gap-8 px-4 py-8 sm:px-8",
               activeTabId === "chat"
                  ? "max-w-[1000px]"
                  : "max-w-[1400px] xl:grid-cols-[minmax(0,1fr)_420px]",
            ].join(" ")}>
            <section className="min-w-0">
               {loadingSummary ? (
                  <DashboardSkeleton />
               ) : summaryError ? (
                  <SectionPanel className="border-red-100 bg-red-50/30 text-red-600">
                     <p className="text-sm font-bold">{summaryError}</p>
                  </SectionPanel>
               ) : (
                  renderVisiblePanels()
               )}
            </section>

            {activeTabId !== "chat" && (
               <aside className="hidden xl:block">
                  <div className="sticky top-24">
                     <AssistantChatPanel
                        messages={messages}
                        inputValue={inputValue}
                        submitting={submitting}
                        className="h-[calc(100vh-140px)]"
                        quickActions={QUICK_ACTIONS}
                        onInputChange={setInputValue}
                        onSubmitMessage={handleSubmitMessage}
                        onQuickAction={handleQuickAction}
                     />
                  </div>
               </aside>
            )}
         </main>
      </div>
   );
}
