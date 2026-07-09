# Antigravity AI - Advanced Azure Foundry Chat Client

Antigravity AI is a modern, responsive, production-ready AI Chat Assistant application built using **Next.js 15 App Router**, **TypeScript**, and **Tailwind CSS**. It is inspired by ChatGPT, Perplexity AI, and Claude, and designed to query models deployed inside your **Azure AI Foundry / Azure OpenAI** instances.

The application is built for secure deployment on Vercel. All sensitive credentials (API key, endpoint URL) are stored strictly client-side inside the user's browser `localStorage` and transmitted to Azure via secure Next.js API route proxies.

---

## Architectural Reorganization Layout

The project follows a clean, decoupled architecture:
- `src/types/`: Central TypeScript typings definitions.
- `src/lib/`: Presets templates library and client-side localStorage state manager.
- `src/components/`: Reusable layouts: responsive navigation bar, code markdown parsers, and custom line-numbered code containers.
- `src/app/`: File-based routes for landing page, chat panels, system templates, settings sliders, and SVG usage graphs.
- `src/app/api/`: Secure server proxies forwarding requests.

---

## Key Advanced Features

- **Context Memory Trimming**: Cap and slice older conversational records dynamically (via `maxContextMessages` sliders) while keeping active System instructions intact.
- **Dynamic Connection Tester**: Settings dashboard containing validating pings to check endpoints before running conversations.
- **Markdown & LaTeX Rendering**: Typeset LaTeX mathematics (`$$E=mc^2$$`) and syntax highlight code files with line numbers.
- **API Error Logging**: Visual tracking of network timeouts or invalid endpoint parameters on the Analytics dashboard.
- **Transcripts Exports**: Download dialogue histories as Markdown (`.md`), serialized JSON structure (`.json`), or trigger print styles for PDFs.

---

## Technical Stack

- **Framework**: Next.js 15.1.0 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4.0
- **Animations**: Framer Motion
- **Icons**: Lucide Icons
- **Markdown & Math**: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `katex`

---

## Local Development Setup

To run the application locally:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment Fallbacks (Optional)**:
   Copy `.env.example` to `.env.local` to define global defaults on your server.
   ```bash
   cp .env.example .env.local
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Vercel Deployment Instructions

1. **Deploying via Vercel CLI**:
   Ensure you have the Vercel CLI installed, then run:
   ```bash
   vercel
   ```

2. **Production Build Verification**:
   To compile and verify the build locally before pushing:
   ```bash
   npm run build
   ```
