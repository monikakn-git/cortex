# CORTEX: Universal AI Context Passport (OpenClaw Backend)

## Overview
CORTEX is an open-source system that extracts, stores, and manages user context across all AI tools (Claude, ChatGPT, Gemini, etc.), running entirely on your local machine. It uses OpenClaw as the agent framework and stores all data in human-readable Markdown/YAML files.

## Project Structure
- `src/` — Core agent logic (TypeScript)
- `skills/` — Modular agent skills (context extraction, conflict detection, etc.)
- `storage/` — Local Markdown/YAML vaults for user context

## Requirements
- Node.js >= 22
- Docker & Docker Compose

## Quick Start
1. Clone this repo
2. Run `docker compose up` to start the agent
3. All data stays local — no cloud, no vendor lock-in

## License
MIT
