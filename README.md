# AIssistant Frontend

Next.js frontend for the AIssistant study app. This app talks to the Fastify backend at https://github.com/sminemb/AIssistant-backend through cookie-authenticated REST endpoints.

## Requirements

- Node.js 20 or newer
- npm
- Backend running at `http://localhost:4000`

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

## Backend Contract

The frontend uses unversioned backend routes:

- `GET /auth/csrf`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /dashboard/summary`
- `GET /study-questions`
- `POST /study-questions`
- `GET /quizzes`
- `POST /quizzes`
- `GET /quizzes/:quizId`
- `POST /quizzes/:quizId/submit`
- `GET /study-progress`

Unsafe requests use `credentials: "include"` and send `X-CSRF-Token`. If the backend returns `CSRF_TOKEN_INVALID`, the API client fetches a fresh CSRF token and retries the request once.

## Scripts

```bash
npm run dev       # Start local dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
npm run test:e2e  # Playwright integration/UI tests
```

## Testing

The Playwright tests mock the backend API at `NEXT_PUBLIC_BACKEND_URL` and cover:

- Auth and dashboard load
- Study Question submission with CSRF retry
- Quiz generation
- Quiz submission/review
- Study Progress refresh
- Logout

Run:

```bash
npm run test:e2e
```
