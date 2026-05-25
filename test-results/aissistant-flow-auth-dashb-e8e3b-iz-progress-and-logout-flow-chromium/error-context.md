# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: aissistant-flow.spec.ts >> auth, dashboard, study question, quiz, progress, and logout flow
- Location: tests\e2e\aissistant-flow.spec.ts:229:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Welcome Back!' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Welcome Back!' })

```

```yaml
- complementary:
  - text: AIssistant
  - button "New Chat +"
  - navigation:
    - button "Dashboard"
    - button "Quizzes"
    - button "Progress"
  - heading "Recent Quizzes" [level=3]
  - heading "Chat History" [level=3]
  - link "Help Center":
    - /url: mailto:carlaviso040@gmail.com
    - img
    - text: Help Center
  - button "Log Out":
    - text: Log Out
    - img
- main:
  - heading "chat" [level=2]
  - heading "Study Assistant" [level=2]
  - text: Welcome to AIssistant! I'm ready to help you learn. What topic shall we explore together today?
  - textbox "Send a message..."
  - button "Send message" [disabled]
  - button "Explain a Topic"
  - button "Create Quiz"
  - button "Study Plan"
- button "Open Tanstack query devtools":
  - img
- alert
```

# Test source

```ts
  156 |     if (method === "GET" && path === "/study-questions") {
  157 |       return json(route, { studyQuestions: state.studyQuestions });
  158 |     }
  159 | 
  160 |     if (method === "POST" && path === "/study-questions") {
  161 |       state.studyQuestionAttempts += 1;
  162 |       if (state.studyQuestionAttempts === 1) {
  163 |         return json(route, { error: { code: "CSRF_TOKEN_INVALID", message: "CSRF token is missing or invalid" } }, 403);
  164 |       }
  165 | 
  166 |       const body = request.postDataJSON() as { questionText: string };
  167 |       const studyQuestion = {
  168 |         id: 201,
  169 |         studentId: 1,
  170 |         questionText: body.questionText,
  171 |         chatbotResponse: "Photosynthesis turns light, water, and carbon dioxide into plant sugar and oxygen.",
  172 |         createdAt: "2026-05-23T05:00:00.000Z",
  173 |       };
  174 |       state.studyQuestions.unshift(studyQuestion);
  175 |       return json(route, { studyQuestion }, 201);
  176 |     }
  177 | 
  178 |     if (method === "GET" && path === "/quizzes") {
  179 |       return json(route, { quizzes: state.quizzes.map(quizListItem) });
  180 |     }
  181 | 
  182 |     if (method === "POST" && path === "/quizzes") {
  183 |       const body = request.postDataJSON() as { quizTopic: string; questionCount?: number };
  184 |       const quiz = createQuizFixture(body.questionCount ?? 5);
  185 |       quiz.quizTopic = body.quizTopic;
  186 |       state.quizzes.unshift(quiz);
  187 |       return json(route, { quiz }, 201);
  188 |     }
  189 | 
  190 |     const quizMatch = path.match(/^\/quizzes\/(\d+)$/);
  191 |     if (method === "GET" && quizMatch) {
  192 |       const quiz = state.quizzes.find((item) => item.id === Number(quizMatch[1]));
  193 |       return quiz ? json(route, { quiz }) : json(route, { error: { code: "QUIZ_NOT_FOUND", message: "Quiz not found" } }, 404);
  194 |     }
  195 | 
  196 |     const submitMatch = path.match(/^\/quizzes\/(\d+)\/submit$/);
  197 |     if (method === "POST" && submitMatch) {
  198 |       const quiz = state.quizzes.find((item) => item.id === Number(submitMatch[1]));
  199 |       if (!quiz?.questions) {
  200 |         return json(route, { error: { code: "QUIZ_NOT_FOUND", message: "Quiz not found" } }, 404);
  201 |       }
  202 | 
  203 |       const body = request.postDataJSON() as { answers: Array<{ quizQuestionId: number; selectedOptionId: number }> };
  204 |       quiz.state = "COMPLETED";
  205 |       quiz.score = 100;
  206 |       quiz.questions = quiz.questions.map((question) => ({
  207 |         ...question,
  208 |         selectedOptionId: body.answers.find((answer) => answer.quizQuestionId === question.id)?.selectedOptionId ?? null,
  209 |         isCorrect: true,
  210 |       }));
  211 |       state.progress = {
  212 |         ...state.progress,
  213 |         completedTopics: 1,
  214 |         totalQuizzes: 1,
  215 |         averageScore: 100,
  216 |         updatedAt: "2026-05-23T05:30:00.000Z",
  217 |       };
  218 |       return json(route, { quiz, studyProgress: state.progress });
  219 |     }
  220 | 
  221 |     if (method === "GET" && path === "/study-progress") {
  222 |       return json(route, { studyProgress: state.progress });
  223 |     }
  224 | 
  225 |     return json(route, { error: { code: "NOT_FOUND", message: `${method} ${path} was not mocked` } }, 404);
  226 |   });
  227 | }
  228 | 
  229 | test("auth, dashboard, study question, quiz, progress, and logout flow", async ({ page }) => {
  230 |   const state: MockState = {
  231 |     loggedIn: false,
  232 |     csrfToken: "csrf-initial",
  233 |     studyQuestionAttempts: 0,
  234 |     studyQuestions: [],
  235 |     quizzes: [],
  236 |     progress: {
  237 |       id: 101,
  238 |       studentId: 1,
  239 |       completedTopics: 0,
  240 |       totalQuizzes: 0,
  241 |       averageScore: 0,
  242 |       updatedAt: "2026-05-23T04:00:00.000Z",
  243 |     },
  244 |   };
  245 | 
  246 |   await mockBackend(page, state);
  247 | 
  248 |   await page.goto("/login");
  249 |   await page.getByLabel("Email Address").fill("ada@example.com");
  250 |   await page.getByLabel("Password").fill("password123");
  251 |   await page.getByRole("button", { name: "Sign In" }).click();
  252 |   await page.waitForURL("**/dashboard**");
  253 |   await page.screenshot({ path: 'debug.png' });
  254 | 
  255 |   await expect(page.getByRole("button", { name: "New Chat +" })).toBeVisible();
> 256 |   await expect(page.getByRole("heading", { name: "Welcome Back!" })).toBeVisible();
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
  257 |   await expect(page.getByText("Topics Mastered")).toBeVisible();
  258 |   await expect(page.getByText("Quizzes Taken")).toBeVisible();
  259 |   await expect(page.getByText("Avg Accuracy", { exact: false })).toBeVisible();
  260 | 
  261 |   await page.getByLabel("Message your AI assistant").fill("Explain photosynthesis");
  262 |   await page.getByRole("button", { name: "Send message" }).click();
  263 |   await expect(page.getByText("Photosynthesis turns light").first()).toBeVisible();
  264 |   await expect(page.getByText("Explain photosynthesis").first()).toBeVisible();
  265 |   expect(state.studyQuestionAttempts).toBe(2);
  266 | 
  267 |   await page.getByPlaceholder("Topic (e.g. Quantum Physics, History...)").fill("Algebra basics");
  268 |   await page.getByLabel("Quiz question count").selectOption("3");
  269 |   await page.getByRole("button", { name: "Generate" }).click();
  270 |   await expect(page.getByRole("heading", { name: "Algebra basics" })).toBeVisible();
  271 |   await expect(page.getByText("Algebra question 3?")).toBeVisible();
  272 | 
  273 |   await page.getByLabel("Option 1.1").check();
  274 |   await page.getByLabel("Option 2.1").check();
  275 |   await page.getByLabel("Option 3.1").check();
  276 |   await page.getByRole("button", { name: "Complete & See Score" }).click();
  277 |   await expect(page.getByText("Accuracy: 100%")).toBeVisible();
  278 | 
  279 |   await expect(page.getByRole("heading", { name: "Study Progress" })).toBeVisible();
  280 |   await expect(page.getByText("Topics Mastered")).toBeVisible();
  281 |   await expect(page.getByText("Quizzes Taken")).toBeVisible();
  282 |   await expect(page.getByText("Avg Accuracy", { exact: false })).toBeVisible();
  283 |   await expect(page.locator("p").filter({ hasText: /^100%$/ })).toBeVisible();
  284 | 
  285 |   await page.getByRole("button", { name: "Log Out" }).click();
  286 |   await expect(page).toHaveURL(/\/login/);
  287 | });
  288 | 
```