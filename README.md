# Muse — Personal AI Assistant

A calm, chat-first personal assistant starter app. It includes a responsive chat interface, browser-local conversation history, editable personal context, and an AI reply endpoint. It does not connect to your email, calendar, or other accounts.

## Run locally

Requirements: Node.js 20 or newer and an OpenAI API key.

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `OPENAI_API_KEY` to your own key, then start the app:

```bash
npm start
```

Visit <http://localhost:3000>.

## Privacy and safety

- The API key stays on the server; do not put it in browser code or commit `.env`.
- Chat history and the optional memory field are saved in your browser's local storage. Clearing browser storage removes them.
- Messages are sent to the configured model provider to generate replies. Avoid entering sensitive information unless you understand the provider's data practices.
- The memory field is optional and editable; it is sent with chat requests to personalize responses.
- The server currently has no user sign-in. Keep it on your own machine unless you add authentication and deployment protections before exposing it to the internet.
- Muse only replies in chat; it does not take actions in other apps.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `OPENAI_API_KEY` | Required API credential | — |
| `OPENAI_MODEL` | Model used for replies | `gpt-4o-mini` |
| `PORT` | Local server port | `3000` |

The chat endpoint limits requests to 20 per minute and validates request sizes. Chat messages are sent to the API in a rolling window of up to 20 messages.
