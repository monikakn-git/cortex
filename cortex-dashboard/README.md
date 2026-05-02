# CORTEX AI Dashboard

CORTEX is a professional, high-impact AI Dashboard built with React and Vite. It serves as a visual interface for managing and exploring a complex, cognitive AI knowledge system. The project features a modern, "New Tech" design aesthetic with vibrant styling and dynamic interactions.

## Features

- **Interactive Knowledge Graph:** The centerpiece of the application. A dynamic, force-directed graph built with D3.js that visualizes cognitive relationships with "electric shock" animations, interactive physics, and large, highly visible nodes.
- **Manual Vault Editor:** A YAML-based editor for manual intervention and configuration of the system's data vaults.
- **AI Coverage Panel:** A dedicated module for tracking AI coverage and system metrics.
- **Health Score Widget:** Real-time health monitoring of the CORTEX cognitive system.
- **Conflict Resolution View:** Diff views for managing data conflicts.
- **Modern UI/UX:** Built with a premium aesthetic featuring sleek animations, a polished dark/glassmorphic theme, and responsive navigation.

## Technology Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **Visualizations:** D3.js
- **Icons:** Lucide React
- **Parsing:** JS-YAML
- **Styling:** Custom CSS

## Getting Started

To run the CORTEX dashboard locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

- `src/components/`: Reusable UI elements, including the `KnowledgeGraph`, `Sidebar`, and `HealthScore`.
- `src/pages/`: Main application views like `GraphPage`, `VaultPage`, and `CoveragePage`.
- `src/App.jsx`: Main application layout and routing configuration.

## Design Philosophy

The CORTEX Dashboard prioritizes visual excellence. It utilizes modern web design best practices, including deep colors, interactive micro-animations, and a layout that feels "alive" to the user, particularly demonstrated in the active physics simulation of the central Knowledge Graph.
