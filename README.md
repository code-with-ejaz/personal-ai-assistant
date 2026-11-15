# Muse — Premium Personal AI Assistant

A responsive, installable PWA for personal chat and productivity. Includes multi-user email/password accounts, PostgreSQL persistence, editable personal memory, task tracking, a daily planning dashboard, optional read-only Google Calendar/Gmail, voice dictation, and a narrowly scoped AI task-creation tool.

## Run locally

Requirements: Node.js 20+, PostgreSQL, and an OpenAI API key.

1. Copy `.env.example` to `.env`; configure `DATABASE_URL`, `SESSION_SECRET` (32+ random characters), `APP_ENCRYPTION_KEY` (exactly 64 hex characters), and `OPENAI_API_KEY`.
2. Start PostgreSQL and create the database named in `DATABASE_URL`.
3. Run `npm install`, `npm run db:migrate`, and `npm start`.
4. Open `http://localhost:3000` and create an account. Passwords must be at least 12 characters.

## App and mobile

The responsive app can be installed from a supported mobile browser using its browser menu (“Add to Home Screen” / “Install app”). The service worker caches only the static shell; it never caches API responses or private workspace data. This is an installable web app/PWA, not a native iOS/Android binary. Voice input uses browser speech recognition where supported and may require microphone permission/HTTPS.

## Features and action boundaries

- **Multi-user login:** Self-service registration, bcrypt password hashes, per-user PostgreSQL data isolation, and server-side PostgreSQL sessions.
- **Memory/tasks:** Each account has editable personal context and tasks with priorities, due dates, completion, and deletion. Deleting the account cascades through stored data.
- **AI agent:** The model may create a task only when the user explicitly asks to add/create/remember one. It cannot delete tasks, send mail, or modify calendars. Verify task details after creation.
- **Google integration:** Optional user-linked OAuth with encrypted tokens at rest and read-only Gmail/calendar scopes. No outbound mail or calendar edits. Google app verification/consent requirements may apply.
- **Email treatment:** Recent inbox metadata/snippets are shown in the integration page; email content is not automatically included in AI prompts.

## Google OAuth (optional)

Enable Gmail API and Google Calendar API in Google Cloud. Create OAuth credentials with callback URL `http://localhost:3000/auth/google/callback` for local work, or the deployed `/auth/google/callback` URL. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`; consent scopes are `gmail.readonly` and `calendar.events.readonly`. Google access tokens are encrypted using `APP_ENCRYPTION_KEY`.

## Deployment

A Dockerfile and Render blueprint are included. Review and adapt `render.yaml` for the database product/region and hosting provider of your choice. Configure every secret in the hosting dashboard, including API credentials and a strong encryption key. The app expects durable PostgreSQL storage, HTTPS, a trusted proxy setting, database backups, and monitoring. Deploy runs the idempotent SQL migration before serving.

Before a public launch, have the deployment and OAuth configuration security-reviewed. Add email verification, password reset, abuse controls, billing/rate limits, automated tests, and a managed session store with the hosting provider's exact constraints. This repository does not ship native binaries or formal compliance certification.

## Important privacy and security notes

- Never commit `.env`, database credentials, encryption keys, OAuth secrets, or production data.
- Chat prompts and saved memory are sent to the configured model provider to generate responses. Review provider privacy/data controls and avoid storing secrets in memory.
- Google API access is read-only. Revoke/disconnect Google access when no longer needed.
- Use HTTPS and secure cookies in production. Set `TRUST_PROXY=true` only behind a correctly configured trusted reverse proxy.
- Keep `APP_ENCRYPTION_KEY` backed up securely; rotating it requires a token re-encryption migration or users must reconnect Google.
- Run regular PostgreSQL backups and test restoration. Configure database TLS according to the provider.
- This is a deployable starter, not a claim of production readiness or a substitute for threat modeling, testing, legal review, or operations planning.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | 32+ character session signing secret |
| `APP_ENCRYPTION_KEY` | Yes | 64 hex characters for AES-256-GCM token encryption |
| `OPENAI_API_KEY` | Chat only | Server-side model credential |
| `OPENAI_MODEL` | No | Model name (defaults to `gpt-4o-mini`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Google only | OAuth configuration |
| `PORT` | No | HTTP port (defaults to 3000) |

