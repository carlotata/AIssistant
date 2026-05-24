export type DashboardTab = {
  id: string;
  label: string;
  icon: "dashboard" | "chat" | "quiz" | "progress" | "users";
};

export type QuickAction = {
  id: string;
  label: string;
  prompt: string;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export type StudyQuestion = {
  id: number;
  studentId: number;
  questionText: string;
  chatbotResponse: string;
  createdAt: string;
};

export type Quiz = {
  id: number;
  studentId: number;
  quizTopic: string;
  score: number | null;
  state: "GENERATED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  questions?: QuizQuestion[];
};

export type QuizQuestion = {
  id: number;
  quizId: number;
  questionText: string;
  position: number;
  selectedOptionId: number | null;
  isCorrect?: boolean | null;
  options: QuizOption[];
};

export type QuizOption = {
  id: number;
  quizQuestionId: number;
  optionText: string;
  position: number;
  isCorrect?: boolean;
};

export type StudyProgress = {
  id: number;
  studentId: number;
  completedTopics: number;
  totalQuizzes: number;
  averageScore: number;
  updatedAt: string;
};

export type DashboardSummary = {
  recentStudyQuestions: StudyQuestion[];
  recentQuizzes: Quiz[];
  studyProgress: StudyProgress;
};
