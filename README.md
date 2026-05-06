<div align="center">

# 🧠 CORTEX — Universal AI Context Passport

**Stop re-explaining yourself to every AI. CORTEX remembers you across Claude, ChatGPT, and Gemini.**

[![Live Backend](https://img.shields.io/badge/Backend-Live%20on%20Render-46E3B7?style=for-the-badge)](https://cortex-backend-42aq.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green?style=for-the-badge)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge)](https://www.typescriptlang.org)

</div>

---

## What is CORTEX?

CORTEX is an open-source system that sits above all AI tools. It:

- 📥 **Extracts** context (beliefs, goals, preferences) from your AI conversations
- 🗄️ **Stores** them locally in human-readable YAML vaults — no cloud, no lock-in
- ⚔️ **Detects conflicts** when Claude says X and ChatGPT says Y
- 💉 **Injects** your context automatically when you switch platforms
- 🧪 **Catches poisoning** — repeated wrong beliefs before they corrupt your workflow
- 📊 **Tracks persona drift** — detects when an AI's tone/helpfulness changes

Built on [OpenClaw](https://openclaw.dev) agent framework.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              CORTEX System                  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Claude  │  │ ChatGPT  │  │  Gemini  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │        │
│       ▼              ▼              ▼        │
│  ┌─────────────────────────────────────┐    │
│  │     Context Extractor (Skill)       │    │
│  └───────────────┬─────────────────────┘    │
│                  │                          │
│       ┌──────────▼──────────┐              │
│       │   Local YAML Vault  │              │
│       │  soul.yaml          │              │
│       │  claude-contexts    │              │
│       │  chatgpt-contexts   │              │
│       │  gemini-contexts    │              │
│       └──────────┬──────────┘              │
│                  │                          │
│    ┌─────────────┼──────────────┐           │
│    ▼             ▼              ▼           │
│ Conflict    Poisoning      Persona          │
│ Detector    Detector       Drift            │
│    │             │              │           │
│    └─────────────▼──────────────┘           │
│              Context Injector               │
│         (Briefing for next AI)              │
└─────────────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Version | Download |
|------|---------|---------|
| Node.js | >= 22 | [nodejs.org](https://nodejs.org) |
| npm | >= 10 | Included with Node.js |
| MongoDB | Atlas URI (free) | [mongodb.com/atlas](https://mongodb.com/atlas) |

> 💡 **No Docker needed for local dev.** MongoDB Atlas free tier works out of the box.

---

## Setup — Mac

```bash
# 1. Clone the repo
git clone https://github.com/monikakn-git/cortex.git
cd cortex

# 2. Install backend dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env — set your MongoDB URI

# 4. Build the TypeScript backend
npm run build

# 5. Run the backend server
npm start
# → API running at http://localhost:5000

# 6. (Optional) Run in dev mode with hot reload
npm run dev
```

### Frontend (Dashboard)

```bash
cd cortex-dashboard
npm install
npm run dev
# → Dashboard at http://localhost:5173
```

---

## Setup — Windows

```powershell
# 1. Clone the repo
git clone https://github.com/monikakn-git/cortex.git
cd cortex

# 2. Install backend dependencies
npm install

# 3. Create environment file (copy manually or use PowerShell)
Copy-Item .env.example .env
# Open .env in Notepad and set your MONGODB_URI

# 4. Build the TypeScript backend
npm run build

# 5. Run the backend server
npm start
# → API running at http://localhost:5000

# 6. (Optional) Dev mode
npm run dev
```

### Frontend (Windows)

```powershell
cd cortex-dashboard
npm install
npm run dev
# → Dashboard at http://localhost:5173
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB Connection URI (required)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/cortex?retryWrites=true&w=majority

# Server Port (optional, defaults to 5000)
PORT=5000
```

> ⚠️ **Never commit your `.env` file.** It is in `.gitignore` by default.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with ts-node (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production server |
| `npm test` | Run full Jest test suite |
| `npm run test:kpi` | Run KPI benchmark and print results |

---

## API Endpoints

Backend live at: **https://cortex-backend-42aq.onrender.com**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/api/kpis` | All KPI results |
| `GET` | `/api/kpis/:metricName` | Specific KPI history |
| `GET` | `/api/logs` | All test logs |
| `POST` | `/api/logs` | Write a test log entry |

---

## Skills (SKILL.md files)

Each CORTEX skill is documented in the `/skills/` directory:

| Skill | Description |
|-------|-------------|
| [`context-extractor.md`](skills/context-extractor.md) | Extracts beliefs, goals, preferences from AI conversations |
| [`memory-writer.md`](skills/memory-writer.md) | Merges extracted signals into YAML vaults |
| [`conflict-detector.md`](skills/conflict-detector.md) | Detects contradictions between AI beliefs |
| [`context-injector.md`](skills/context-injector.md) | Generates platform-specific briefings for AI context injection |
| [`context-poisoning-detector.md`](skills/context-poisoning-detector.md) | Detects repeated wrong beliefs |
| [`persona-drift-detector.md`](skills/persona-drift-detector.md) | Tracks AI tone/behavior changes over time |

---

## KPI Benchmarks

Run `npm run test:kpi` to generate live results. Reference targets:

| KPI | Target | How Measured |
|-----|--------|--------------|
| Extraction Accuracy (F1) | ≥ 80% | Prompt generation + JSON parse accuracy on 20-sample dataset |
| Injection Latency | < 100ms | Average briefing generation time across 3 platforms × 5 runs |
| Conflict Recall Rate | ≥ 66% | Known conflict pairs detected / total known conflicts |

---

## Running Tests

```bash
# Run all logic tests (no MongoDB needed)
npm test -- --testPathPattern="extraction|injection|conflict-detection|poisoning|persona-drift"

# Run KPI benchmark
npm run test:kpi

# Run all tests (requires MongoDB URI in .env)
npm test
```

---

## Project Structure

```
cortex/
├── src/
│   ├── index.ts                    # Entry point
│   ├── heartbeat.ts                # 10-minute background loop
│   ├── conflict-detector.ts        # Belief contradiction detection
│   ├── belief-extractor.ts         # Belief extraction from contexts
│   ├── context-loader.ts           # Load YAML vault contexts
│   ├── alert-logger.ts             # Log conflicts to YAML
│   ├── skills/
│   │   ├── context-extractor.ts    # LLM extraction skill
│   │   ├── memory-writer.ts        # YAML vault merge logic
│   │   ├── context-injector.ts     # Platform briefing generator
│   │   ├── context-poisoning-detector.ts
│   │   └── persona-drift-detector.ts
│   ├── routes/
│   │   ├── kpiRoutes.ts
│   │   └── logRoutes.ts
│   ├── models/
│   │   ├── KpiResult.ts
│   │   └── TestLog.ts
│   └── db/
│       └── mongoose.ts
├── tests/
│   ├── setup.ts
│   ├── evaluation/
│   │   └── evaluation-dataset.yaml  # 20 benchmark conversations
│   └── integration/
│       ├── extraction.test.ts
│       ├── injection.test.ts
│       ├── conflict-detection.test.ts
│       ├── poisoning.test.ts
│       ├── persona-drift.test.ts
│       ├── vault.test.ts
│       ├── conflict.test.ts
│       └── kpi-runner.ts
├── skills/                          # SKILL.md documentation files
├── cortex-dashboard/                # React + Vite frontend
├── cortex-extension/                # Browser extension (WIP)
├── storage/                         # Auto-created YAML vaults (gitignored)
├── config/
│   └── heartbeat.yaml
├── HEARTBEAT.md
├── SOUL.md
├── docker-compose.yml
└── README.md
```

---

## The 4 WOW Moments

1. **🔀 Cross-AI Context Injection** — Paste a CORTEX briefing into Claude, then ask Gemini the same question — both already know your project, preferences, and constraints
2. **⚔️ Live Conflict Detection** — Claude says "Use Kubernetes", ChatGPT says "Avoid Kubernetes" — CORTEX catches it instantly
3. **🧪 Health Score Drop** — Inject a wrong belief 3+ times across AI sessions — CORTEX's poisoning detector flags it and your context health score visibly drops
4. **📦 Context Passport Export** — Export your full SOUL.yaml (Context Will) and import it into any new AI session instantly

---

## Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Backend API | Render | https://cortex-backend-42aq.onrender.com |
| Frontend Dashboard | Vercel | *(your Vercel URL)* |

---

## License

MIT — See [LICENSE](LICENSE) for details.

---

<div align="center">
Built for the OpenClaw AI Hackathon · May 2026
</div>
