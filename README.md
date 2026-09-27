# Syllo — AI Student Study SaaS (local-first prototype)

Syllo turns uploaded course files into a practical study workflow, then adds an AI study coach that can work with the student's own course material.

## Core product

- Animated student-name onboarding
- Long SaaS-style dashboard
- Course upload with drag & drop
- Local IndexedDB course/file storage
- Local PDF page-count detection
- Course workspace with page workload and progress
- Study planner based on daily available time
- Deep / balanced / fast reading pace
- Configurable focus-block length
- Page-by-page daily sessions
- Progress tracking
- Focus Mode with animated timer
- Study Tips & Motivation
- Professional mobile bottom navigation
- Framer Motion interactions
- Three.js semester visual

## Syllo AI

The AI experience is integrated throughout the app, not just added as a generic chatbot.

It includes:

- General Study Coach
- Course-aware AI conversations
- PDF understanding through Claude's PDF input support
- Image and plain-text file context
- Smart summaries
- Simple explanations with examples
- Course quizzes
- Flashcards
- Exam preparation
- AI study strategy
- Motivation / getting-started coaching
- Quick AI actions inside each course
- AI links from Planner, Focus Mode, and Tips
- Browser-local conversation history

Course files remain stored in the browser. Supported files are sent to the configured Claude API only when the student enables **Use course files** and makes an AI request.

For this prototype, Syllo sends up to 3 supported files per AI request, with limits intended to keep requests practical. PDFs, common images, and plain-text files are supported by the AI connector. Word/PowerPoint files remain stored and usable in Syllo, but should be converted to PDF if you want Claude to analyze them in this version.

## Connect Claude AI

Create a file named `.env.local` in the project root:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-5
```

Then restart the dev server.

The API key is used only inside the Next.js server route (`/api/ai`) and is never exposed as a `NEXT_PUBLIC_` variable.

An example file is included as `.env.local.example`.

## Run it

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

On Windows you can also double-click `START-SYLLO.bat`.

## Local storage behavior

Courses and uploaded files are stored in IndexedDB in the current browser. Study settings, progress, student name, and AI conversation history are stored in localStorage. Clearing this site's browser data removes them.

PDF page counts are detected locally from the PDF structure. The file itself is not sent anywhere unless the student explicitly uses an AI action with **Use course files** enabled.

## Arabic font

Arabic UI is configured to prefer **Greta Arabic** when that commercial font is already installed/licensed on the device. The project does not redistribute font files. Fallbacks are Noto Sans Arabic, Tahoma, and Arial.
