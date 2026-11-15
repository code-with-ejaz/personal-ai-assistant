# Muse — Personal AI Assistant

A responsive, chat-first personal productivity assistant with account sign-in, persistent tasks and personal memory, daily planning, optional read-only Google Calendar/Gmail, and browser speech-to-text input.

## Run locally

Requirements: Node.js 20+ and an OpenAI API key.

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `OPENAI_API_KEY`, `APP_USERNAME`, `APP_PASSWORD` (use a long unique password), and `SESSION_SECRET` (use a long random value). Then run:

```bash
npm start
```

Visit <http://localhost:3000> and sign in with `APP_USERNAME` and `APP_PASSWORD`.

## Features

- **Chat assistant:** OpenAI-backed chat with a concise, supportive assistant persona.
- **Persistent personal memory:** Edit and save user context; the assistant receives it as context for chats.
- **Task tracker:** Add, prioritize, complete, filter, and delete tasks, optionally with due dates.
- **Daily planner/dashboard:** A daily focus list is created from open tasks, with calendar events when Google is connected.
- **Google Calendar and Gmail:** Optional OAuth connection with read-only scopes. Calendar shows the next seven days; inbox shows up to ten recent messages' sender, subject, date, and snippet. Muse does not send mail or modify calendar events.
- **Voice input:** Uses browser Web Speech recognition to dictate into the chat composer (browser and microphone permission required).
- **Responsive multi-page interface:** Chat, overview, tasks, planner, memory, and calendar/email pages adapt to mobile screens.

## Optional Google setup

1. Create an OAuth client in Google Cloud Console and enable the Gmail API and Google Calendar API.
2. Add the client ID and secret to `.env`; configure the redirect URI exactly as `http://localhost:3000/auth/google/callback` for local use (or set `GOOGLE_REDIRECT_URI` to your deployed callback).
3. Add that same callback URL to the OAuth client and configure the OAuth consent screen.
4. Restart the app, sign in, and select **Connect Google**.

Requested permissions are limited to `calendar.events.readonly` and `gmail.readonly`. Tokens are stored in `data/user-state.json`; disconnect from the app to remove them. Do not commit this file.

## Privacy and deployment safety

- `.env` and `data/` are ignored by Git. Keep API keys, session secrets, user state, OAuth tokens, and backups private.
- The OpenAI API key stays on the server. Chat requests and saved memory are sent to the configured model provider when generating a reply; avoid sharing sensitive information unless you have reviewed that provider's data practices.
- The app currently supports one configured account (`APP_USERNAME`/`APP_PASSWORD`), not public self-service registration or multiple isolated users. Tasks and memory persist in a local JSON file.
- Express's default in-memory session store is suitable only for local development/single-process testing. Before public deployment, use a persistent session store, HTTPS, a durable encrypted database and backups, and appropriate access controls. Configure a strong `SESSION_SECRET`.
- Google OAuth credentials/tokens are sensitive. Use a private deployment, authorized redirect URIs, and the minimum scopes. The integration only reads data; no emails are sent and no events are changed.
- Voice recognition is performed by the browser's speech API; availability and speech processing practices depend on the browser.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `OPENAI_API_KEY` | Required AI API credential | — |
| `OPENAI_MODEL` | Model used for replies | `gpt-4o-mini` |
| `APP_USERNAME` | Single account login | — |
| `APP_PASSWORD` | Single account password | — |
| `SESSION_SECRET` | Session cookie signing secret | temporary random value (set this) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth credentials | — |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback | `http://localhost:3000/auth/google/callback` |
| `PORT` | Local server port | `3000` |

