# Muse — Personal AI Assistant

## Setup
Requires Node.js 20+, PostgreSQL, and optionally OpenAI / Google OAuth credentials.

1. Copy `.env.example` to `.env`. Set `DATABASE_URL`, a random `SESSION_SECRET` (at least 32 characters), a 64-hex-character `APP_ENCRYPTION_KEY`, and `OPENAI_API_KEY` if using chat.
2. Start PostgreSQL and create the database in `DATABASE_URL`.
3. Run `npm install`, `npm run db:migrate`, `npm run check`, and `npm start`.
4. Visit `http://localhost:3000`; use **New to Muse? Create an account** to register. Account passwords must be at least 12 characters.

## Integrated features

PostgreSQL stores user accounts, profiles, tasks, Google connections, and sessions. Passwords are bcrypt-hashed. Workspace queries are scoped to the logged-in user. The AI has one limited write action: create a task when explicitly requested. Google Calendar and Gmail are optional read-only integrations; tokens are encrypted at rest. The responsive UI includes dashboard, task list, planner, voice input, focus timer, CSV export, and PWA install support.

## Secrets and sessions

Never commit `.env` or put secrets in frontend files. Production requires HTTPS, a strong `SESSION_SECRET`, PostgreSQL, and a stable 32-byte encryption key encoded as 64 hex characters. The session cookie is HTTP-only, SameSite=Lax, and Secure in production; sessions are stored in PostgreSQL. `TRUST_PROXY=true` should only be used when the service is behind the hosting provider's trusted proxy. `APP_ENCRYPTION_KEY` must be preserved; losing/changing it makes existing Google tokens unreadable.

Generate values locally and keep them private:

```sh
openssl rand -hex 32  # SESSION_SECRET
openssl rand -hex 32  # APP_ENCRYPTION_KEY
```

## Google OAuth
Enable Gmail and Calendar APIs; set OAuth credentials and the exact callback URI `https://YOUR_HOST/auth/google/callback` (local: `http://localhost:3000/auth/google/callback`). The app asks only for `gmail.readonly` and `calendar.events.readonly`. It does not send emails or edit events. Snippets are not sent to chat automatically.

## Deployment
A Dockerfile and Render blueprint are included as deployment configuration, but no deployment has been performed. Create a managed PostgreSQL database with your hosting provider, set its `DATABASE_URL` as a secret, and configure all remaining environment variables in the provider dashboard. Review the provider's current blueprint syntax, database TLS options, backup policies, and costs. The container runs the idempotent schema migration at startup and exposes `/api/health`.

Before a public launch, add and independently review email verification, account recovery, monitoring, abuse controls, data retention and privacy disclosures, backup/restore drills, and OAuth consent verification. This starter is not security-certified. Review the model provider's data practices before sending personal memory or messages.

## Validate

`npm run check` performs JavaScript syntax checks. For a live smoke test, configure PostgreSQL and secrets, start the app, and visit `/api/health`; then test registration, login/logout, task isolation between two accounts, memory save/load, and Google disconnect. Browser-based end-to-end testing was not run from this repository-editing environment.
