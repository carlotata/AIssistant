# AIssistant

AIssistant is an intelligent academic study assistant designed to help students focus, learn efficiently, and test their knowledge.

## Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, TanStack Query (React Query), React Hook Form, Zod.
- **Backend**: Fastify, Prisma, PostgreSQL, Zod (validation), `@fastify/rate-limit`.

## Project Structure
- `app/`: Routing and layout definitions.
- `components/`: Modular UI components.
    - `admin/`: Admin-specific interfaces.
    - `dashboard/`: Student dashboard components.
    - `shared/`: Reusable UI elements.
    - `icons/`: Consolidated SVG components.
- `constants/`: Shared constants and configuration.
- `lib/`: Shared utilities (API client, Auth context).
- `types/`: Global TypeScript definitions.

## Key Features
- **Role-Based Security**: Strict frontend redirects and backend API authorization (Admin vs. Student).
- **Data Management**: Powered by TanStack Query for caching and auto-syncing.
- **Form Validation**: Strict schema-based validation using Zod and React Hook Form.
- **Security**: 
    - Rate-limiting (100 req/min global, 5 req/min on auth routes).
    - CSRF protection.
    - Admin-only data filtering.

## Getting Started
1. Install dependencies: `npm install`
2. Configure `.env` file (Backend).
3. Run development: `npm run dev`
