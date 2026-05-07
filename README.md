<div align="center">

# 🧠 CORTEX — Universal AI Context Passport

**Take control of your AI's memory. CORTEX selectively syncs your project context, roles, and goals across ChatGPT and Claude.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green?style=for-the-badge)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge)](https://www.typescriptlang.org)

</div>

---

## What is CORTEX?

CORTEX is an open-source "Context Layer" that sits between you and your AI tools. It:

- 📥 **Extracts Intelligence**: Automatically captures beliefs, project details, and preferences from your AI threads.
- 🗄️ **Local YAML Vaults**: Stores everything in human-readable files on your machine — zero cloud, total privacy.
- 🕸️ **Cognitive Topology**: Visualizes your knowledge as a living graph in a glossy, cosmic dashboard.
- 🔄 **Selective Injection**: You choose exactly which past project or persona context to "Load" into your current AI session.
- ⚔️ **Conflict & Drift Detection**: Catches when different AIs contradict each other or when an AI's behavior shifts over time.

Built on [OpenClaw](https://openclaw.dev) agent framework.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CORTEX LOCAL ECOSYSTEM               │
│                                                         │
│  ┌──────────────┐      ┌───────────────┐      ┌────────┐│
│  │   CHROME     │      │   PRO         │      │ BACKEND││
│  │   EXTENSION  ◄──────►   DASHBOARD   ◄──────► SERVER ││
│  │ (Selection)  │      │ (Topology)    │      │ (5001) ││
│  └──────┬───────┘      └───────────────┘      └────┬───┘│
│         │                                          │    │
│         ▼                                          ▼    │
│  ┌────────────────────┐                   ┌─────────────┐│
│  │ AI PLATFORMS       │                   │ LOCAL VAULT ││
│  │ (ChatGPT / Claude) │                   │ (YAML Files)││
│  └────────────────────┘                   └─────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Setup — Local Environment

### 1. Backend Server
```bash
git clone https://github.com/monikakn-git/cortex.git
cd cortex
npm install
npm run build
npm start 
# → API running at http://localhost:5001
```

### 2. Frontend Dashboard
```bash
cd cortex-dashboard
npm install
npm run dev
# → Dashboard at http://localhost:5173
```

### 3. Browser Extension
1. Open Chrome Extensions (`chrome://extensions`)
2. Enable "Developer Mode"
3. Click "Load Unpacked" and select the `cortex-extension` folder.

---

## ✨ New in v2.0 (Hackathon Polish)

- 🌌 **Cosmic Pro Dashboard**: A complete UI/UX redesign with a Deep Royal Slate theme and animated nebula backgrounds.
- 🕸️ **Cognitive Topology**: An interactive D3-powered Knowledge Graph that visualizes your context vault.
- 🆔 **Persistent Identity**: In-place profile editing in the dashboard header.
- 🔄 **Selective Context Recall**: pick specific past project contexts to "Load" via the extension popup.
- 🎯 **Intelligent Naming**: Real-time sync between AI chat titles and knowledge nodes.

---

## The 5 WOW Moments

1. **🕸️ Cognitive Topology** — See your entire digital soul visualized as a living graph.
2. **🧠 Selective Injection** — Pick a project from yesterday and "Load" its context into your current GPT session instantly.
3. **🔀 Cross-AI Sync** — Extract from Claude, name it "Project X", and it appears as "Project X" in your Dashboard and ChatGPT.
4. **⚔️ Live Conflict Detection** — Detect contradictions between different AI responses across platforms.
5. **📦 Local Context Passport** — Your data stays on your disk in human-readable `soul.yaml` and platform-specific vaults.

---

## License

MIT — See [LICENSE](LICENSE) for details.

---

<div align="center">
Built for the OpenClaw AI Hackathon · May 2026
</div>
