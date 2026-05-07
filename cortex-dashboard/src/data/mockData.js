// ─── Data for CORTEX Dashboard ──────────────────────────────────────────────
// Nodes and edges are empty by default — they populate from real extractions.
export const mockVault = {
  nodes: [],
  edges: [],
};

export const mockConflicts = [];

export const mockCoverage = {
  claude:   { has: [], missing: [] },
  chatgpt:  { has: [], missing: [] },
  gemini:   { has: [], missing: [] },
};

export const aiColors = {
  claude:  "#7c6aff",
  chatgpt: "#4ade80",
  gemini:  "#facc15",
};

export const categoryColors = {
  identity:   "#7c6aff",
  profession: "#5eead4",
  project:    "#f472b6",
  skill:      "#fb923c",
  preference: "#facc15",
  context:    "#60a5fa",
};
