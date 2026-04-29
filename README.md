# LexGuard CLM | Enterprise Legal Intelligence Platform

LexGuard is a professional-grade Contract Lifecycle Management (CLM) platform designed for modern legal teams. It combines deterministic legal logic with simulated AI intelligence to provide a high-fidelity, secure, and automated contract management experience.

![LexGuard Header](https://img.shields.io/badge/Status-Production--Ready-blueviolet?style=for-the-badge)
![Built With](https://img.shields.io/badge/Built%20With-React%20%7C%20TypeScript%20%7C%20Vite-blue?style=for-the-badge)

## 🚀 Key Features

### 1. Intelligence Dashboard
*   **Global KPI Tracking**: Real-time monitoring of contracts in queue, WIP, and live execution.
*   **Risk Pulse**: Visual gauges for Playbook Compliance and Liability Exposure.
*   **Activity Stream**: Instant telemetry feed of the most recent system actions.

### 2. Smart Editor & AI Remediation
*   **Autonomous Analysis**: One-click AI Summarization to extract key risks and executive bullet points.
*   **Playbook Alignment**: Real-time scanning for clause deviations against organizational standards.
*   **One-Click Remediation**: Instantly apply "Standard Language" to non-compliant clauses using AI-suggested fixes.
*   **Visual Redlining**: Logical diff engine to compare drafts against historical baselines (Additions in Green, Deletions in Red Strikethrough).

### 3. Digital Vault (Repository)
*   **High-Density Discovery**: Advanced repository with multi-dimensional filtering (Business Unit, Lifecycle Status, Category).
*   **Actor Tracking**: Full visibility into document ownership and "Last Modified By" metadata.
*   **Metadata Governance**: Centralized tagging for Departments, BUs, and Legal Leads.

### 4. Enterprise Governance
*   **Identity Provisioning**: Full RBAC-based user management with granular Business Unit restrictions.
*   **Playbook Architecture**: Centralized repository of standard legal clauses and risk levels.
*   **Global Taxonomy**: Dynamic management of organizational tags (Departments, BUs, Categories).
*   **Forensic Audit Trail**: Immutable log of every system event, context switch, and document modification.

### 5. Document Interoperability
*   **DOCX Import**: Seamlessly import external Microsoft Word documents directly into the Smart Editor using the integrated `mammoth.js` engine.

## 🛠️ Technology Stack
*   **Frontend**: React 18, TypeScript, Vite
*   **Animations**: Framer Motion
*   **Icons**: Lucide React
*   **Legal Logic**: `diff-match-patch` (Redlining), `mammoth` (DOCX Parsing)
*   **Containerization**: Docker & Docker Compose
*   **Styling**: Vanilla CSS with modern Glassmorphism principles

## 📦 Getting Started

### Prerequisites
*   Docker & Docker Compose installed on your system.

### Deployment
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/ianloe/lexguardclm
    cd lexguardclm
    ```

2.  **Build and Start the Container**:
    ```bash
    docker compose up --build
    ```

3.  **Access the Platform**:
    Open your browser and navigate to `http://localhost`.

## 📜 Audit & Security
LexGuard enforces strict accountability through its Forensic Audit Trail. Every user action, from "Identity Protocol" changes to "AI Remediation" events, is recorded with a sub-second timestamp and actor attribution.

---
**Developed for High-Stakes Legal Operations.**
© 2026 LexGuard Intelligence Systems.
