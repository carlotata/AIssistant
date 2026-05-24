import { expect, test, type Page, type Route } from "@playwright/test";

const backendUrl = "http://localhost:4000";

type MockState = {
  loggedIn: boolean;
  csrfToken: string;
  studyQuestionAttempts: number;
  studyQuestions: Array<{
    id: number;
    studentId: number;
    questionText: string;
    chatbotResponse: string;
    createdAt: string;
  }>;
  quizzes: QuizFixture[];
  progress: {
    id: number;
    studentId: number;
    completedTopics: number;
    totalQuizzes: number;
    averageScore: number;
    updatedAt: string;
  };
};

type QuizFixture = {
  id: number;
  studentId: number;
  quizTopic: string;
  score: number | null;
  state: "GENERATED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  questions?: Array<{
    id: number;
    quizId: number;
    questionText: string;
    position: number;
    selectedOptionId: number | null;
    isCorrect?: boolean | null;
    options: Array<{
      id: number;
      quizQuestionId: number;
      optionText: string;
      position: number;
      isCorrect?: boolean;
    }>;
  }>;
};

function json(route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  });
}

function createQuizFixture(questionCount: number): QuizFixture {
  return {
    id: 301,
    studentId: 1,
    quizTopic: "Algebra basics",
    score: null,
    state: "GENERATED",
    createdAt: "2026-05-23T05:00:00.000Z",
    updatedAt: "2026-05-23T05:00:00.000Z",
    questions: Array.from({ length: questionCount }, (_, index) => {
      const questionId = 400 + index;
      return {
        id: questionId,
        quizId: 301,
        questionText: `Algebra question ${index + 1}?`,
        position: index + 1,
        selectedOptionId: null,
        options: [0, 1, 2, 3].map((optionIndex) => ({
          id: questionId * 10 + optionIndex,
          quizQuestionId: questionId,
          optionText: `Option ${index + 1}.${optionIndex + 1}`,
          position: optionIndex + 1,
          isCorrect: optionIndex === 0,
        })),
      };
    }),
  };
}

function quizListItem(quiz: QuizFixture) {
  return {
    id: quiz.id,
    studentId: quiz.studentId,
    quizTopic: quiz.quizTopic,
    score: quiz.score,
    state: quiz.state,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
  };
}

async function mockBackend(page: Page, state: MockState) {
  await page.route(`${backendUrl}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;

    if (method === "GET" && path === "/auth/csrf") {
      state.csrfToken = `csrf-${Date.now()}`;
      return json(route, { csrfToken: state.csrfToken }, 200, {
        "Set-Cookie": `aissistant_csrf=${state.csrfToken}; Path=/; SameSite=Lax`,
      });
    }

    if (method === "GET" && path === "/auth/me") {
      if (!state.loggedIn) {
        return json(route, { error: { code: "AUTH_REQUIRED", message: "Authentication is required" } }, 401);
      }

      return json(route, {
        student: {
          id: 1,
          name: "Ada Student",
          email: "ada@example.com",
          createdAt: "2026-05-23T04:00:00.000Z",
        },
      });
    }

    if (method === "POST" && (path === "/auth/login" || path === "/auth/register")) {
      state.loggedIn = true;
      return json(route, {
        student: {
          id: 1,
          name: "Ada Student",
          email: "ada@example.com",
          createdAt: "2026-05-23T04:00:00.000Z",
        },
      });
    }

    if (method === "POST" && path === "/auth/logout") {
      state.loggedIn = false;
      return route.fulfill({ status: 204 });
    }

    if (method === "GET" && path === "/dashboard/summary") {
      return json(route, {
        recentStudyQuestions: state.studyQuestions.slice(0, 5),
        recentQuizzes: state.quizzes.map(quizListItem).slice(0, 5),
        studyProgress: state.progress,
      });
    }

    if (method === "GET" && path === "/study-questions") {
      return json(route, { studyQuestions: state.studyQuestions });
    }

    if (method === "POST" && path === "/study-questions") {
      state.studyQuestionAttempts += 1;
      if (state.studyQuestionAttempts === 1) {
        return json(route, { error: { code: "CSRF_TOKEN_INVALID", message: "CSRF token is missing or invalid" } }, 403);
      }

      const body = request.postDataJSON() as { questionText: string };
      const studyQuestion = {
        id: 201,
        studentId: 1,
        questionText: body.questionText,
        chatbotResponse: "Photosynthesis turns light, water, and carbon dioxide into plant sugar and oxygen.",
        createdAt: "2026-05-23T05:00:00.000Z",
      };
      state.studyQuestions.unshift(studyQuestion);
      return json(route, { studyQuestion }, 201);
    }

    if (method === "GET" && path === "/quizzes") {
      return json(route, { quizzes: state.quizzes.map(quizListItem) });
    }

    if (method === "POST" && path === "/quizzes") {
      const body = request.postDataJSON() as { quizTopic: string; questionCount?: number };
      const quiz = createQuizFixture(body.questionCount ?? 5);
      quiz.quizTopic = body.quizTopic;
      state.quizzes.unshift(quiz);
      return json(route, { quiz }, 201);
    }

    const quizMatch = path.match(/^\/quizzes\/(\d+)$/);
    if (method === "GET" && quizMatch) {
      const quiz = state.quizzes.find((item) => item.id === Number(quizMatch[1]));
      return quiz ? json(route, { quiz }) : json(route, { error: { code: "QUIZ_NOT_FOUND", message: "Quiz not found" } }, 404);
    }

    const submitMatch = path.match(/^\/quizzes\/(\d+)\/submit$/);
    if (method === "POST" && submitMatch) {
      const quiz = state.quizzes.find((item) => item.id === Number(submitMatch[1]));
      if (!quiz?.questions) {
        return json(route, { error: { code: "QUIZ_NOT_FOUND", message: "Quiz not found" } }, 404);
      }

      const body = request.postDataJSON() as { answers: Array<{ quizQuestionId: number; selectedOptionId: number }> };
      quiz.state = "COMPLETED";
      quiz.score = 100;
      quiz.questions = quiz.questions.map((question) => ({
        ...question,
        selectedOptionId: body.answers.find((answer) => answer.quizQuestionId === question.id)?.selectedOptionId ?? null,
        isCorrect: true,
      }));
      state.progress = {
        ...state.progress,
        completedTopics: 1,
        totalQuizzes: 1,
        averageScore: 100,
        updatedAt: "2026-05-23T05:30:00.000Z",
      };
      return json(route, { quiz, studyProgress: state.progress });
    }

    if (method === "GET" && path === "/study-progress") {
      return json(route, { studyProgress: state.progress });
    }

    return json(route, { error: { code: "NOT_FOUND", message: `${method} ${path} was not mocked` } }, 404);
  });
}

test("auth, dashboard, study question, quiz, progress, and logout flow", async ({ page }) => {
  const state: MockState = {
    loggedIn: false,
    csrfToken: "csrf-initial",
    studyQuestionAttempts: 0,
    studyQuestions: [],
    quizzes: [],
    progress: {
      id: 101,
      studentId: 1,
      completedTopics: 0,
      totalQuizzes: 0,
      averageScore: 0,
      updatedAt: "2026-05-23T04:00:00.000Z",
    },
  };

  await mockBackend(page, state);

  await page.goto("/login");
  await page.getByLabel("Email Address").fill("ada@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByRole("button", { name: "Open profile" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent Insights" })).toBeVisible();
  await expect(page.getByText("Avg Accuracy", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Chat" }).click();
  await page.getByLabel("Message your AI assistant").fill("Explain photosynthesis");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Photosynthesis turns light").first()).toBeVisible();
  await expect(page.getByText("Explain photosynthesis").first()).toBeVisible();
  expect(state.studyQuestionAttempts).toBe(2);

  await page.getByRole("button", { name: "Quizzes" }).click();
  await page.getByPlaceholder("Topic (e.g. Quantum Physics, History...)").fill("Algebra basics");
  await page.getByLabel("Quiz question count").selectOption("3");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByRole("heading", { name: "Algebra basics" })).toBeVisible();
  await expect(page.getByText("Algebra question 3?")).toBeVisible();

  await page.getByLabel("Option 1.1").check();
  await page.getByLabel("Option 2.1").check();
  await page.getByLabel("Option 3.1").check();
  await page.getByRole("button", { name: "Complete & See Score" }).click();
  await expect(page.getByText("Accuracy: 100%")).toBeVisible();

  await page.getByRole("button", { name: "Progress" }).click();
  await expect(page.getByRole("heading", { name: "Study Progress" })).toBeVisible();
  await expect(page.getByText("Topics Mastered")).toBeVisible();
  await expect(page.getByText("Quizzes Taken")).toBeVisible();
  await expect(page.getByText("Avg Accuracy", { exact: false })).toBeVisible();
  await expect(page.locator("p").filter({ hasText: /^100%$/ })).toBeVisible();

  await page.getByRole("button", { name: "Open profile" }).click();
  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
