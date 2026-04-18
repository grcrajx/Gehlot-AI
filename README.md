# GehlotAI - Smart Learning Assistant

GehlotAI is a modular AI learning assistant designed for students. It supports multiple AI providers and subject-specific tutoring logic.

## Features
- **Modern Chat Interface**: Polished UI built with React & Tailwind CSS v4.
- **Subject Specialization**: Choose between Math, Science, English, History, or Coding.
- **Explain Like I'm 5**: Instantly simplify complex assistant explanations.
- **Multi-Provider Support**: Switch between Gemini, OpenAI, Hugging Face, and Ollama.
- **Local History**: Chat history is persisted in your browser's `localStorage`.

## Setting Up Providers

### 1. Gemini (Default)
Gemini is configured to work out of the box in this environment using the system provided `GEMINI_API_KEY`. It runs entirely on the client side for maximum speed.

### 2. OpenAI / Compatible APIs
To use OpenAI or any OpenAI-compatible API (like Groq, Together, etc.):
1. Click the provider dropdown in the header.
2. Select "OpenAI API".
3. Enter your **API Key** and **Model ID**.
4. If using a custom endpoint, currently you'd need to modify `server.ts` to allow custom URLs (or use the API URL field if implemented).

### 3. Hugging Face
1. Select "Hugging Face".
2. Enter your **Access Token** and the **Model Path** (e.g. `mistralai/Mistral-7B-Instruct-v0.2`).

### 4. Ollama (Local)
1. Ensure Ollama is running on your local machine with CORS enabled.
2. Select "Local LLM (Ollama)".
3. Enter the **Model Name** (e.g., `llama3`).
4. Ensure the API URL is accessible from where the app is running.

## Adding a New Provider

To add a new AI provider:
1. **Frontend**: Add the provider definition to the `PROVIDERS` constant in `src/App.tsx`.
2. **Backend**: Add a new `if` block in the `/api/chat` route in `server.ts` to handle the specific API's request/response format.
3. **Types**: Ensure any new config fields are added to the interface in `src/App.tsx`.

## Tech Stack
- **Frontend**: React, Tailwind CSS v4, Motion, Lucide Icons.
- **Backend**: Node.js, Express.
- **Markdown**: react-markdown with @tailwindcss/typography.
