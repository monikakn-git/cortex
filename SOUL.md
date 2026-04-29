# SOUL.md — User Preference Schema & Life-State Taxonomy

> **Purpose:** Define the structure of the user's context — their preferences, life state, beliefs, and goals. CORTEX uses SOUL.md to extract, store, and inject user context across AI platforms.

---

## 1. User Profile

```yaml
user:
  name: ""
  role: ""
  goals: []
  communication_style: ""
  timezone: ""
```

### Fields:
- **name**: User's display name.
- **role**: Primary role (e.g., "OpenClaw Agent Engineer", "Full-Stack Developer").
- **goals**: Short-term and long-term goals for the project.
- **communication_style**: Preferred tone (e.g., "concise", "detailed", "casual").
- **timezone**: For scheduling context-aware interactions.

---

## 2. Preferences

```yaml
preferences:
  coding:
    language: ""
    framework: ""
    style: ""
    testing_framework: ""
  response:
    format: ""        # e.g., "markdown", "json", "plain"
    verbosity: ""     # e.g., "brief", "detailed", "balanced"
    include_code: true
  tools:
    preferred: []      # e.g., ["vscode", "docker", "git"]
    avoided: []
  ai_interaction:
    prompt_style: ""  # e.g., "step-by-step", "direct"
    feedback_frequency: ""  # e.g., "on-completion", "daily"
```

### Fields:
- **coding**: Language, framework, code style, testing preferences.
- **response**: How the user wants AI responses formatted.
- **tools**: Which tools the user prefers or avoids.
- **ai_interaction**: How the user likes to interact with AIs.

---

## 3. Life-State Taxonomy

> **Taxonomy:** CORTEX categorizes the user's current state into one or more of these states:

| State | Description | Typical Triggers |
|-------|-------------|------------------|
| `learning` | Acquiring new knowledge or skills | New concept, tutorial, documentation |
| `building` | Creating new features or projects | Feature request, greenfield task |
| `debugging` | Fixing issues or errors | Bug report, stack trace, test failure |
| `refactoring` | Improving existing code without new features | Code review, performance optimization |
| `planning` | Designing architecture or roadmap | Architecture decision, sprint planning |
| `researching` | Investigating options or alternatives | Technology comparison, proof of concept |
| `documenting` | Writing or updating docs | README update, API docs |
| `deploying` | Releasing to production | Deployment pipeline, release notes |

### State Example:
```yaml
life_state:
  primary: "building"
  secondary: ["learning", "debugging"]
  context: "Building CORTEX backend with OpenClaw"
  started_at: "2026-04-28T10:00:00Z"
```

---

## 4. Beliefs & Constraints

> **Beliefs:** What the user believes about their project, team, or technology choices.  
> **Constraints:** Hard or soft limits the user has set.

```yaml
beliefs:
  project:
    - belief: "OpenClaw is the right framework for this agent"
      confidence: 0.8
      source: "Claude recommendation"
  technology:
    - belief: "TypeScript is preferred over JavaScript for type safety"
      confidence: 0.9
      source: "Past experience"

constraints:
  hard:
    - "All data must stay local — no cloud storage"
    - "No vendor lock-in — must work with Claude, GPT, Gemini"
  soft:
    - "Prefer Markdown over JSON for human readability"
    - "Keep Docker Compose for local development"
```

### Fields:
- **belief**: A statement the user has expressed or AI has inferred.
- **confidence**: 0.0–1.0 score of how certain the belief is.
- **source**: Which AI or conversation the belief came from.
- **constraints**: Hard (must follow) vs. soft (preferred) constraints.

---

## 5. Interaction History

> **History:** Summary of past AI interactions (for context injection).

```yaml
history:
  last_updated: "2026-04-29T12:00:00Z"
  recent_contexts:
    - ai: "Claude"
      date: "2026-04-29"
      summary: "Set up OpenClaw environment, created project structure"
    - ai: "ChatGPT"
      date: "2026-04-28"
      summary: "Discussed CORTEX architecture"
```

---

## 6. Metadata

```yaml
metadata:
  version: "1.0.0"
  created: "2026-04-28"
  last_modified: "2026-04-29"
  soul_hash: ""  # SHA-256 of SOUL.md for change detection
```

---

## Usage in CORTEX

1. **Extraction**: When CORTEX extracts context from AI conversations, it updates SOUL.md.
2. **Injection**: When the user switches AIs, CORTEX injects relevant sections of SOUL.md into the new AI’s prompt.
3. **Conflict Detection**: HEARTBEAT.md compares beliefs across AIs and flags contradictions.
4. **Human Readability**: SOUL.md is stored as YAML in `storage/soul.yaml` and rendered as Markdown for easy editing.

---

## Example Complete SOUL.md

```yaml
# SOUL.md — User Preference Schema
user:
  name: "OpenClaw Agent Engineer"
  role: "Backend Developer"
  goals:
    - "Build CORTEX backend with OpenClaw"
    - "Implement context extraction and conflict detection"
  communication_style: "concise"
  timezone: "UTC"

preferences:
  coding:
    language: "TypeScript"
    framework: "OpenClaw"
    style: "strict-typescript"
    testing_framework: "jest"
  response:
    format: "markdown"
    verbosity: "balanced"
    include_code: true
  tools:
    preferred: ["vscode", "docker", "git"]
    avoided: ["cloud-functions"]
  ai_interaction:
    prompt_style: "step-by-step"
    feedback_frequency: "on-completion"

life_state:
  primary: "building"
  secondary: ["learning"]
  context: "Building CORTEX backend with OpenClaw"
  started_at: "2026-04-28T10:00:00Z"

beliefs:
  project:
    - belief: "OpenClaw is the right framework for this agent"
      confidence: 0.8
      source: "Claude recommendation"
  technology:
    - belief: "TypeScript is preferred over JavaScript"
      confidence: 0.9
      source: "Past experience"

constraints:
  hard:
    - "All data must stay local"
    - "No vendor lock-in"
  soft:
    - "Prefer Markdown over JSON"

history:
  last_updated: "2026-04-29T12:00:00Z"
  recent_contexts:
    - ai: "Claude"
      date: "2026-04-29"
      summary: "Set up OpenClaw environment"

metadata:
  version: "1.0.0"
  created: "2026-04-28"
  last_modified: "2026-04-29"
  soul_hash: ""
```

---

## Next Steps

- **HEARTBEAT.md**: 10-minute background loop for conflict detection.
- **Skills**: context-extractor, conflict-detector, context-injector, memory-writer.

---

> **Remember:** SOUL.md is a living document. CORTEX updates it automatically after each AI conversation, but you can also edit it manually.