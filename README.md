# 🌟 Northstar AI - Smart Contract Review Assistant

An AI-powered compliance engine designed to accelerate legal reviews, flag potential transaction risks, and enforce company standards. Built for the **Intra IUB Programming Club Hackathon (Final Round)**.

🚀 **Live Preview:** Run at [https://north-star-phi-five.vercel.app/]

---

## 📖 Overview & Architecture

When vendors send SaaS, freelance, or distribution agreements, legal compliance teams must read through long pages to identify clauses that create liabilities for the company. 

**Northstar AI** automates this workflow. It parses agreements, extracts clauses, maps them against Approved Company Standards, assigns risk ratings, provides exact string evidence, and routes reviews for final human approval.

### 🛡️ Critical Safety Guardrails
1. **Zero Hallucination (Safe Abstention):** Hackathons specifically test missing clauses (e.g. test cases `MI-01`, `MI-02`, `MI-03`). The assistant features a **double-layer safeguard** (LLM prompt rules + JS validator fallback) to strictly return **"Not Enough Information"** rather than fabricating rules or dates when information is omitted from the contract.
2. **Human-in-the-Loop Workflow:** The assistant does **NOT** make final binding legal decisions. Every evaluated card flags `"Human Review Required"` and offers interactive `Approve`, `Reject`, and `Flag` controls with a notes field.
3. **Legal Disclaimer:** Prominently states that the tool does not provide legal advice.

---

## ✨ Features

*   **7-Category Audit:** Evaluates Payment (`STD-PAY-01`), Termination (`STD-TERM-01`), Data Protection (`STD-DP-01`), Confidentiality (`STD-CONF-01`), Automatic Renewal (`STD-REN-01`), Intellectual Property (`STD-IP-01`), and Limitation of Liability (`STD-LIAB-01`).
*   **In-Document Evidence Highlighting:** Clicking on any clause review card or Q&A output automatically switches the editor to **Read & Highlight** mode, scrolling to and highlighting the exact quote segment in the text with a pulsing visual glow.
*   **Executive Risk Scorecard:** Summarizes contract health at a glance with a segmented, color-coded progress bar (`🔴 High`, `🟡 Med`, `🟢 Low`, `⚪ Missing`).
*   **Audit Report Export:** Compiles the audit (including standards, risks, human review statuses, and typed notes) into a download-ready Markdown file (`Compliance_Audit_[Contract_ID].md`).
*   **Interactive QA Playground:** A sidebar playground containing all 12 public validation questions and a custom chat interface for ad-hoc compliance checks.
*   **Local State Sync:** All human review decisions and notes are synced to the browser's `LocalStorage`, preserving state across page reloads.

---

## 🛠️ Technology Stack

*   **Framework:** React 18 (Single Page Application)
*   **Build Tool:** Vite + TypeScript
*   **AI Engine:** Gemini API (using the official `@google/generative-ai` SDK and the active **`gemini-3.5-flash`** model)
*   **Styling:** Custom Vanilla CSS (Modern dark mode with Glassmorphism)
*   **Icons:** Lucide React

---

## 📂 Project Structure

```text
├── dataset/                     # Pre-loaded raw problem datasets and PDFs
├── src/
│   ├── data/
│   │   ├── contracts.ts         # Preloaded contracts C-001 to C-008
│   │   ├── standards.ts         # Preloaded company clause standards
│   │   └── testCases.ts         # Preloaded PQ-01 to PQ-12 and MI-01 to MI-03
│   ├── services/
│   │   └── gemini.ts            # Structured JSON API queries & system prompts
│   ├── App.tsx                  # Main dashboard rendering & state logic
│   ├── index.css                # Visual design system and theme variables
│   ├── main.tsx                 # Mounting React root
│   └── vite-env.d.ts            # Environment type definitions
├── index.html                   # Mount point & Google Font imports
├── package.json                 # Dependency definitions
├── tsconfig.json                # TypeScript options
└── vite.config.ts               # Vite server configurations
```

---

## 🚀 Installation & Local Run

### Prerequisites
Make sure you have [Node.js (v18+)](https://nodejs.org/) installed.

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Amirun-Nahar/North_Star.git
   cd North_Star
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Verify Build Compilation:**
   ```bash
   npm run build
   ```

Open browser and navigate to: **([https://north-star-phi-five.vercel.app/])**

---

## 🏁 Presentation Verification Plan

To demonstrate the safety and interactive capabilities to the judges:

1.  **Configure API Key:** Click the **API Key Missing** badge in the header, paste your Gemini API key, and save.
2.  **Verify Batch Analysis:** Click **Run Compliance Review** on `C-001`. Review the cards in the center panel. Notice the segmented risk scorecard at the top.
3.  **Show Evidence Highlighting:** Click on the **Automatic Renewal** card. The left panel will switch to **Read Mode** and highlight the 60-day notice requirement text automatically.
4.  **Test Safe Abstention:** In the right panel, click **MI-01 (C-004)**, **MI-02 (C-007)**, or **MI-03 (C-008)**. Verify the output safely returns **"Not Enough Information"** without hallucinating values.
5.  **Audit & Export:** Click **Approve** on the Payment card, add a note in the feedback field, and click **Export Audit Report** in the header to download the compliance summary file.

---

## 🛡️ Security & Future Scalability Pitch Notes

When asked about how to scale this product to enterprise standards:
*   **Privacy & Key Isolation:** The client-side token management ensures that raw API keys and private contract text are never routed to an external database—they stay completely within the user's local browser memory.
*   **Context Scaling:** For long contracts (50+ pages), we can move from raw text contexts to a **Hybrid RAG (Retrieval-Augmented Generation)** architecture by creating a vector store (e.g. Pinecone/Chroma) and embedding chunked clause paragraphs to retrieve standards.
*   **Document Ingestion:** Future iterations would integrate cloud-based OCR services (such as AWS Textract or Azure Document Intelligence) to parse scanned PDFs, tables, and images.

---

*Disclaimer: This project was built solely as a prototype for educational hackathon evaluation and does not constitute binding legal advice.*
