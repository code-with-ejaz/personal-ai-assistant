# Muse — Premium Personal AI Assistant

Muse is an installable, responsive personal productivity web app. The repository now includes a polished UI layer, PostgreSQL-backed multi-user accounts, user-scoped memory and tasks, a limited AI task-creation action, optional read-only Google integrations, and starter deployment configuration.

## Features

- Email/password registration and login with bcrypt hashes and per-user PostgreSQL data isolation.
- Persistent memory and task lists; AI task creation is limited to direct user requests.
- Daily planner, dashboard, Google Calendar/Gmail read-only views, voice dictation, focus timer, and task CSV export.
- Installable PWA shell for mobile browsers. This is not a native iOS/Android binary; use “Add to Home Screen” or “Install app” in a supported browser.
- Optional Google OAuth scopes are read-only; the assistant does not send emails or change calendar events.

## Local setup

1. Copy `.env.example` to `.env`. Configure `DATABASE_URL`, `SESSION_SECRET` (32+ random characters), `APP_ENCRYPTION_KEY` (64 hex characters), and `OPENAI_API_KEY`.
2. Start PostgreSQL and create the database.
3. Run `npm install`, `npm run db:migrate`, and `npm start`.
4. Visit `http://localhost:3000`, create an account, and sign in.

For Google OAuth, enable Gmail and Calendar APIs, configure OAuth credentials and the callback URL in `.env`, then connect from Calendar & email. Email snippets are shown in the integration page and are not automatically included in chat prompts.

## Deployment and security

`Dockerfile` and `render.yaml` are deployment starting points, not a deployment already performed. Review the provider's current blueprint syntax, choose a supported managed PostgreSQL plan, configure HTTPS and trusted proxy settings, and enter secrets via the hosting dashboard. `APP_ENCRYPTION_KEY` must be a manually supplied 32-byte key represented as 64 hex characters; preserve it securely or existing Google tokens cannot be decrypted. Do not commit credentials, user data, or `.env`.

Before exposing the app publicly, security-review account recovery and email verification, session-store behavior, backups/restore, rate limiting at the edge, database TLS, monitoring, privacy disclosures, and OAuth consent verification. Multi-user auth does not by itself make the app production-certified. Review model provider data practices before placing personal data in memory or chat.

Generate secrets locally (keep the output private):

```bash
openssl rand -hex 32  # SESSION_SECRET (32 bytes)
openssl rand -hex 32  # APP_ENCRYPTION_KEY (exactly 64 hex characters)
```

