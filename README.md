# Colosseum

**Multi-LLM arena for side-by-side model comparison with a persistent AI overseer.**

Send one prompt to the best model from each provider and compare their responses in real-time. A persistent overseer watches everything and provides meta-analysis on demand. Switch to roleplay mode to watch models improvise a scene in character.

**Live**: [colosseum-frontend-production.up.railway.app](https://colosseum-frontend-production.up.railway.app)

---

## Why Compare Multiple LLMs?

Different models think differently. Claude tends toward nuance and caveats, GPT toward directness and structure, Gemini toward breadth and citation. No single model is best at everything — and the differences are often invisible unless you see them side by side.

Colosseum makes these differences visible:

- **Arena mode** sends the same prompt to three models simultaneously and displays their responses in parallel panels
- **A persistent overseer** (any model you choose) watches all responses and can compare, critique, or synthesize on demand
- **Roleplay mode** lets models take on characters and improvise multi-turn conversations

### When is this useful?

- **Prompt engineering** — see how different models interpret the same instruction and iterate on the prompt that gets the best result across all three
- **Model selection** — evaluating which provider to use for a specific task (coding, writing, analysis, creative work)
- **Getting multiple perspectives** — ask a complex question and see three genuinely different approaches, then ask the overseer which is strongest
- **Creative exploration** — use roleplay mode to explore scenarios, brainstorm dialogue, or test character dynamics with different models playing different roles
- **Red-teaming prompts** — see if any model produces unsafe, inaccurate, or low-quality output for a given prompt before deploying it

### Example use cases

1. *"Explain quantum entanglement to a 10-year-old"* — Compare which model nails the analogy vs. which overcomplicates it, then ask the overseer to pick the winner
2. *"Write a Python function to merge two sorted lists"* — See three different implementations side by side, refresh any panel to get a different approach
3. *"Draft a cold outreach email for a SaaS product"* — Compare tone, structure, and persuasion across models
4. **Roleplay**: A startup founder (GPT-5.4), a VC (Claude Opus), and a skeptical engineer (Gemini Pro) debate whether to pivot — watch their dynamics unfold in character

---

## Modes

### Arena

One prompt, three models, side-by-side comparison.

1. Select one model per provider (Anthropic, Google, OpenAI)
2. Type your prompt and submit
3. All three respond in parallel panels
4. Each panel is individually refreshable — re-run just one model to iterate
5. The overseer (left sidebar) sees all responses and you can chat with it

```
+-------------------+------------------+------------------+------------------+
|    Overseer       |   Claude Panel   |   Gemini Panel   |   GPT Panel      |
|    (chat)         |   (response)     |   (response)     |   (response)     |
|                   |   [Refresh]      |   [Refresh]      |   [Refresh]      |
+-------------------+------------------+------------------+------------------+
```

### Roleplay

2-3 models take on characters and improvise a scene.

1. Define 2-3 characters (name, role description, which model plays them)
2. Write a scenario
3. Press Start — models take turns responding in character
4. Each character keeps responses short and snappy (1-3 sentences)
5. Characters can vote to end the scene naturally with `/end`
6. The overseer watches the full transcript and can analyze character dynamics

```
+-------------------+----------------------------------------------+
|    Overseer       |   Roleplay Stage                             |
|    (chat)         |   [Character A]: "Hello, detective."         |
|                   |   [Character B]: "Cut the pleasantries."     |
|                   |   [Character C]: "Both of you, sit down."    |
+-------------------+----------------------------------------------+
```

---

## Features

- **Side-by-side comparison** of three models on the same prompt
- **Persistent overseer** that sees all responses/transcripts and maintains conversation history
- **Individual panel refresh** — re-run any single model without touching the others
- **Roleplay with turn-taking** — 2 or 3 characters, configurable max turns
- **Mode switching** — toggle between Arena and Roleplay without losing overseer context
- **Tier-based model selection** — Flagship / Balanced / Lite tiers for fair comparison
- **Extended thinking** support for models that offer it
- **SSE streaming** for real-time roleplay turns
- **Dark/light theme** with browser preference detection

---

## Supported Models

**Anthropic**: Claude Opus 4.6, Sonnet 4.6, 3.7 Sonnet, Haiku 4.5, 3.5 Sonnet, 3.5 Haiku

**Google**: Gemini 3 Pro Preview, 2.5 Pro, 2.5 Flash, 2.5 Flash Lite

**OpenAI**: GPT-5.4 / 5.3 / 5.2 / 5.1 / 5.0 (+ Mini/Nano variants), GPT-4.1 series, GPT-4o series, o4-mini, o3, o1-pro, o1

`✦` = extended thinking &nbsp; `⚡` = always-on reasoning (o-series)

Models without a valid API key are automatically excluded.

---

## Running Locally

### Prerequisites
- Python 3.9+
- Node.js 18+
- API keys for at least one provider

### Backend
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env  # then add your API keys
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

Open `http://localhost:5173`

---

## Deployment

Two Railway services:
- **Backend**: Serves API at `/api/*` and frontend static files at `/`
- **Frontend** (optional): Standalone if not using monorepo serving

**Environment variables:**
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY` or `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `PORT` (set automatically by Railway)

---

## Tech Stack

- **Backend**: Python, FastAPI, async/await, SSE streaming
- **Frontend**: React 18, Vite, Tailwind CSS
- **AI SDKs**: Anthropic, Google GenAI, OpenAI (all async)
- **Deployment**: Railway (Railpack)

---

## How Multi-LLM Comparison Helps

| Scenario | Single Model | Colosseum |
|----------|-------------|-----------|
| Writing a prompt | You get one answer; no idea if another model handles it better | See three interpretations instantly, pick the best framing |
| Choosing a provider | Trial and error across three dashboards | Direct side-by-side on the same prompt |
| Complex question | One perspective, one set of biases | Three perspectives + an overseer that synthesizes the strongest points |
| Creative brainstorming | One voice | Three voices + an analyst watching them all |
| Evaluating model updates | Compare old vs new by memory | Refresh one panel with the updated model, compare live |
