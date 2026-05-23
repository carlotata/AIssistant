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
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
         {children}
      </div>
   );
}

function SectionPanel({ children }: { children: React.ReactNode }) {
   return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
         {children}
      </section>
   );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
   return (
      <div className="flex min-h-24 min-w-0 flex-col items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
         <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            {icon ?? <TrendUpIcon className="h-5 w-5" />}
         </div>
         <div className="min-w-0 sm:text-right">
            <p className="text-sm font-medium leading-5 text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold leading-none text-slate-950">{value}</p>
         </div>
      </div>
   );
}

function ProgressCards({ progress }: { progress: StudyProgress }) {
   return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
         <Metric label="Completed Topics" value={progress.completedTopics.toString()} icon={<ChatIcon className="h-5 w-5" />} />
         <Metric label="Completed Quizzes" value={progress.totalQuizzes.toString()} icon={<ListChecksIcon className="h-5 w-5" />} />
         <Metric label="Average Score" value={averageScoreLabel(progress.averageScore)} />
      </div>
   );
}

function ProgressPanel({ progress }: { progress: StudyProgress }) {
   return (
      <SectionPanel>
         <div className="mb-5 flex items-center gap-3">
            <TrendUpIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Study Progress</h2>
         </div>

         <ProgressCards progress={progress} />

         <div className="mt-5 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {progress.totalQuizzes > 0
               ? `You have completed ${progress.totalQuizzes} quiz${progress.totalQuizzes === 1 ? "" : "zes"} with an average score of ${averageScoreLabel(progress.averageScore)}.`
               : "Complete a generated quiz to start building your progress record."}
         </div>
      </SectionPanel>
   );
}

function QuestionsPanel({ questions, title }: { questions: StudyQuestion[]; title: string }) {
   return (
      <SectionPanel>
         <div className="mb-5 flex items-center gap-3">
            <ChatIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
         </div>

         {questions.length === 0 ? (
            <EmptyState>Ask a study question to save your first answer.</EmptyState>
         ) : (
            <div className="space-y-3">
               {questions.map((question) => (
                  <article key={question.id} className="rounded-2xl bg-slate-50 p-4">
                     <p className="text-sm font-semibold text-slate-900">{question.questionText}</p>
                     <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{question.chatbotResponse}</p>
                     <p className="mt-3 text-xs font-medium text-slate-400">{formatDate(question.createdAt)}</p>
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
         <div className="mb-5 flex items-center gap-3">
            <ListChecksIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
         </div>

         {quizzes.length === 0 ? (
            <EmptyState>Generated quizzes will appear here.</EmptyState>
         ) : (
            <div className="space-y-3">
               {quizzes.map((quiz) => (
                  <button
                     key={quiz.id}
                     type="button"
                     onClick={() => onSelectQuiz(quiz.id)}
                     className="block w-full rounded-xl bg-slate-50 p-4 text-left transition hover:bg-blue-50">
                     <div className="flex items-start justify-between gap-3">
                        <div>
                           <p className="text-sm font-semibold text-slate-900">{quiz.quizTopic}</p>
                           <p className="mt-1 text-xs font-medium text-slate-400">{formatDate(quiz.createdAt)}</p>
                        </div>
                        <span
                           className={[
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              quiz.state === "COMPLETED"
                                 ? "bg-emerald-100 text-emerald-700"
                                 : "bg-amber-100 text-amber-700",
                           ].join(" ")}>
                           {quiz.state === "COMPLETED" ? `Score ${averageScoreLabel(quiz.score ?? 0)}` : "Generated"}
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
      <div className="grid gap-4">
         {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-3xl bg-white" />
         ))}
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
         <div className="mb-5 flex items-center gap-3">
            <ListChecksIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Create Quiz</h2>
         </div>

         <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]">
            <input
               value={quizTopic}
               onChange={(event) => setQuizTopic(event.target.value)}
               placeholder="Enter a quiz topic..."
               disabled={quizLoading}
               className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <label className="sr-only" htmlFor="quiz-question-count">
               Quiz question count
            </label>
            <select
               id="quiz-question-count"
               value={quizQuestionCount}
               onChange={(event) => setQuizQuestionCount(Number(event.target.value))}
               disabled={quizLoading}
               className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
               aria-label="Quiz question count">
               {[3, 5, 7, 10].map((count) => (
                  <option key={count} value={count}>
                     {count} Qs
                  </option>
               ))}
            </select>
            <button
               type="button"
               onClick={() => createQuiz(quizTopic)}
               disabled={quizLoading || !quizTopic.trim()}
               className="h-12 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
               {quizLoading ? "Working..." : "Generate"}
            </button>
         </div>

         {quizError && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
               {quizError}
            </div>
         )}

         {activeQuiz?.questions && (
            <div className="mt-6 space-y-4">
               <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                     <p className="text-sm font-medium text-slate-500">Active quiz</p>
                     <h3 className="text-lg font-semibold text-slate-950">{activeQuiz.quizTopic}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                     {activeQuiz.state === "COMPLETED" ? `Score ${averageScoreLabel(activeQuiz.score ?? 0)}` : "Generated"}
                  </span>
               </div>

               {activeQuiz.questions.map((question) => (
                  <fieldset key={question.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                     <legend className="px-1 text-sm font-semibold text-slate-900">
                        {question.position}. {question.questionText}
                     </legend>
                     <div className="mt-3 grid gap-2">
                        {question.options.map((option) => {
                           const isSelected = selectedAnswers[question.id] === option.id;
                           const isCompleted = activeQuiz.state === "COMPLETED";
                           const isCorrect = option.isCorrect === true;

                           return (
                              <label
                                 key={option.id}
                                 className={[
                                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition",
                                    isSelected ? "border-blue-300 bg-white text-slate-950" : "border-slate-200 bg-white text-slate-600",
                                    isCompleted && isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "",
                                    isCompleted && isSelected && !isCorrect ? "border-red-200 bg-red-50 text-red-700" : "",
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
                                    className="mt-0.5 h-4 w-4"
                                 />
                                 <span>{option.optionText}</span>
                              </label>
                           );
                        })}
                     </div>
                  </fieldset>
               ))}

               {activeQuiz.state !== "COMPLETED" && (
                  <button
                     type="button"
                     onClick={submitQuiz}
                     disabled={quizLoading}
                     className="h-12 w-full rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                     Submit Quiz
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
            <div className="space-y-6">
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
                     <p className="text-sm text-red-600">{questionsError}</p>
                  </SectionPanel>
               ) : (
                  <QuestionsPanel title="Saved Questions" questions={allQuestions} />
               )}
            </div>
         );
      }

      if (activeTabId === "quizzes") {
         return (
            <>
               {quizPanel}
               {quizzesLoading ? (
                  <DashboardSkeleton />
               ) : quizzesError ? (
                  <SectionPanel>
                     <p className="text-sm text-red-600">{quizzesError}</p>
                  </SectionPanel>
               ) : (
                  <QuizzesPanel title="All Quizzes" quizzes={allQuizzes} onSelectQuiz={openQuiz} />
               )}
            </>
         );
      }

      if (activeTabId === "progress") {
         if (progressLoading) {
            return <DashboardSkeleton />;
         }

         if (progressError) {
            return (
               <SectionPanel>
                  <p className="text-sm text-red-600">{progressError}</p>
               </SectionPanel>
            );
         }

         return <ProgressPanel progress={progress ?? summary.studyProgress} />;
      }

      return (
         <>
            <ProgressCards progress={summary.studyProgress} />
            <QuestionsPanel title="Recent Questions" questions={summary.recentStudyQuestions} />
            {quizPanel}
            <QuizzesPanel title="Recent Quizzes" quizzes={summary.recentQuizzes} onSelectQuiz={openQuiz} />
         </>
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
      <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
         <DashboardHeader tabs={DASHBOARD_TABS} activeTabId={activeTabId} onTabChange={handleTabChange} />

         <main
            className={[
               "mx-auto grid w-full gap-6 px-4 py-6 sm:px-6",
               activeTabId === "chat"
                  ? "max-w-[900px]"
                  : "max-w-[1220px] xl:grid-cols-[minmax(330px,0.46fr)_minmax(0,1fr)]",
            ].join(" ")}>
            <section className="space-y-6">
               {loadingSummary ? (
                  <DashboardSkeleton />
               ) : summaryError ? (
                  <section className="rounded-3xl border border-red-100 bg-white p-6 text-sm text-red-600 shadow-sm">
                     {summaryError}
                  </section>
               ) : (
                  renderVisiblePanels()
               )}
            </section>

            {activeTabId !== "chat" && (
               <AssistantChatPanel
                  messages={messages}
                  inputValue={inputValue}
                  submitting={submitting}
                  className="xl:min-h-[690px]"
                  quickActions={QUICK_ACTIONS}
                  onInputChange={setInputValue}
                  onSubmitMessage={handleSubmitMessage}
                  onQuickAction={handleQuickAction}
               />
            )}
         </main>
      </div>
   );
}
