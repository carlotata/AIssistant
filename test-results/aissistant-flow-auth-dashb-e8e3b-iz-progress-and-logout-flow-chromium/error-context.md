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
  - button "Attach file"
  - button "Toggle web search"
  - textbox "Send a message..."
  - button "Send message" [disabled]
  - button "Explain a Topic"
  - button "Create Quiz"
  - button "Study Plan"
- button "Open Tanstack query devtools":
  - img
- alert
```