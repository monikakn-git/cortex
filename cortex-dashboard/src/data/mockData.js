// ─── Mock Data for CORTEX Dashboard ─────────────────────────────────────────
export const mockVault = {
  nodes: [
    // Identity
    { id: "n1",  label: "John Doe",        category: "identity",    ai: ["claude","chatgpt","gemini"], conflict: false, detail: "Full name of the user"          },
    { id: "n2",  label: "Age: 28",         category: "identity",    ai: ["claude","chatgpt"],          conflict: false, detail: "User's age"                     },
    { id: "n3",  label: "Location: NYC",   category: "identity",    ai: ["claude","gemini"],           conflict: true,  detail: "Claude: NYC | Gemini: San Francisco" },
    { id: "n4",  label: "Pronouns: He/Him",category: "identity",    ai: ["claude"],                    conflict: false, detail: "User's preferred pronouns"      },

    // Profession
    { id: "n5",  label: "Software Engineer",category:"profession",  ai: ["claude","chatgpt","gemini"], conflict: false, detail: "Current job title"              },
    { id: "n6",  label: "React Developer", category: "profession",  ai: ["claude","chatgpt"],          conflict: false, detail: "Frontend specialization"        },
    { id: "n7",  label: "Salary: $120k",   category: "profession",  ai: ["chatgpt"],                   conflict: true,  detail: "ChatGPT: $120k | Claude: $95k" },
    { id: "n8",  label: "5 Yrs Experience",category: "profession",  ai: ["claude","gemini"],           conflict: false, detail: "Years in the field"             },

    // Projects
    { id: "n9",  label: "CORTEX Project",  category: "project",     ai: ["claude","chatgpt","gemini"], conflict: false, detail: "Current hackathon project"      },
    { id: "n10", label: "Hackathon May '26",category:"project",     ai: ["claude","gemini"],           conflict: false, detail: "Event details"                  },
    { id: "n11", label: "OpenClaw Contrib", category:"project",     ai: ["claude"],                    conflict: false, detail: "Open source contribution"       },
    { id: "n12", label: "Deadline: May 8", category: "project",     ai: ["claude","chatgpt","gemini"], conflict: false, detail: "Project deadline"               },

    // Skills
    { id: "n13", label: "D3.js",           category: "skill",       ai: ["claude","chatgpt"],          conflict: false, detail: "Data visualization library"     },
    { id: "n14", label: "Python",          category: "skill",       ai: ["claude","chatgpt","gemini"], conflict: false, detail: "Programming language"           },
    { id: "n15", label: "Machine Learning",category: "skill",       ai: ["gemini"],                    conflict: false, detail: "ML expertise"                   },
    { id: "n16", label: "System Design",   category: "skill",       ai: ["claude","gemini"],           conflict: false, detail: "Architecture skills"            },

    // Preferences
    { id: "n17", label: "Prefers Dark Mode",category:"preference",  ai: ["claude","chatgpt"],          conflict: false, detail: "UI preference"                  },
    { id: "n18", label: "Vim User",        category: "preference",  ai: ["claude"],                    conflict: true,  detail: "Claude: Vim | ChatGPT: VS Code" },
    { id: "n19", label: "Remote Worker",   category: "preference",  ai: ["chatgpt","gemini"],          conflict: false, detail: "Work location preference"       },
    { id: "n20", label: "Morning Person",  category: "preference",  ai: ["claude"],                    conflict: false, detail: "Productivity schedule"          },

    // Context
    { id: "n21", label: "Speaks Spanish",  category: "context",     ai: ["gemini"],                    conflict: false, detail: "Secondary language"             },
    { id: "n22", label: "Team Size: 4",    category: "context",     ai: ["claude","chatgpt"],          conflict: false, detail: "Current team"                   },
    { id: "n23", label: "Startup Founder", category: "context",     ai: ["chatgpt"],                   conflict: true,  detail: "ChatGPT thinks user is founder; Claude disagrees" },
    { id: "n24", label: "Open Source Fan", category: "context",     ai: ["claude","gemini"],           conflict: false, detail: "Open source philosophy"         },
  ],
  edges: [
    { source: "n1",  target: "n2"  },
    { source: "n1",  target: "n3"  },
    { source: "n1",  target: "n4"  },
    { source: "n1",  target: "n5"  },
    { source: "n5",  target: "n6"  },
    { source: "n5",  target: "n7"  },
    { source: "n5",  target: "n8"  },
    { source: "n5",  target: "n13" },
    { source: "n5",  target: "n14" },
    { source: "n5",  target: "n16" },
    { source: "n9",  target: "n10" },
    { source: "n9",  target: "n11" },
    { source: "n9",  target: "n12" },
    { source: "n9",  target: "n13" },
    { source: "n1",  target: "n9"  },
    { source: "n14", target: "n15" },
    { source: "n1",  target: "n17" },
    { source: "n1",  target: "n18" },
    { source: "n1",  target: "n19" },
    { source: "n1",  target: "n20" },
    { source: "n1",  target: "n21" },
    { source: "n9",  target: "n22" },
    { source: "n1",  target: "n23" },
    { source: "n1",  target: "n24" },
    { source: "n24", target: "n11" },
    { source: "n6",  target: "n13" },
    { source: "n3",  target: "n19" },
  ]
};

export const mockConflicts = [
  {
    id: "c1",
    nodeId: "n3",
    field: "Location",
    aiA: "claude",    valueA: "New York City, NY",
    aiB: "gemini",   valueB: "San Francisco, CA",
    severity: "high",
    suggestion: "New York City, NY"
  },
  {
    id: "c2",
    nodeId: "n7",
    field: "Salary",
    aiA: "chatgpt",  valueA: "$120,000 / year",
    aiB: "claude",   valueB: "$95,000 / year",
    severity: "medium",
    suggestion: "$95,000 / year"
  },
  {
    id: "c3",
    nodeId: "n18",
    field: "Editor Preference",
    aiA: "claude",   valueA: "Vim",
    aiB: "chatgpt",  valueB: "Visual Studio Code",
    severity: "low",
    suggestion: "Vim"
  },
  {
    id: "c4",
    nodeId: "n23",
    field: "Role",
    aiA: "chatgpt",  valueA: "Startup Founder",
    aiB: "claude",   valueB: "Software Engineer (Employee)",
    severity: "high",
    suggestion: "Software Engineer (Employee)"
  }
];

export const mockCoverage = {
  claude:   { has: ["n1","n2","n4","n5","n6","n8","n9","n11","n12","n13","n14","n16","n17","n18","n20","n22","n23","n24"], missing: ["n7","n15","n19","n21","n10"] },
  chatgpt:  { has: ["n1","n2","n5","n6","n7","n9","n12","n13","n14","n17","n18","n19","n22","n23"],                        missing: ["n3","n4","n8","n10","n11","n15","n16","n20","n21","n24"] },
  gemini:   { has: ["n1","n3","n5","n8","n9","n10","n12","n14","n15","n16","n19","n21","n24"],                             missing: ["n2","n4","n6","n7","n11","n13","n17","n18","n20","n22","n23"] },
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
