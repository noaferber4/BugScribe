# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Run everything (from repo root):**
```bash
npm run dev
```
Starts frontend on `http://localhost:5173` and backend on `http://localhost:3002` in parallel via `concurrently`.

**Frontend only:**
```bash
npm run dev -w frontend   # dev server
npm run build -w frontend # tsc + vite build
npm run lint -w frontend  # eslint
```

**Backend only:**
```bash
npm run dev -w backend    # tsx watch (hot reload)
npm run build -w backend  # tsc to dist/
npm start -w backend      # run compiled dist/index.js
```

**Environment:** Create `backend/.env` with `ANTHROPIC_API_KEY=sk-ant-...` and `PORT=3002`. The Vite proxy in `frontend/vite.config.ts` points to `http://localhost:3002` — if you change the port, update both files.

## Architecture

### Data flow
1. User fills a form (`StructuredForm`) or types free text (`FreeTextArea`) in `InputArea`
2. `App.tsx` calls `useAnalyze.analyze()` → `lib/api.ts` POSTs to `/api/analyze`
3. Vite proxies `/api` → Express backend on port 3002
4. `routes/analyze.ts` validates the body, calls `buildPrompt()` then `streamReport()`
5. `claude.ts` streams from Claude (`claude-opus-4-6`, adaptive thinking, prompt caching on system message) via SSE
6. Frontend `lib/api.ts` reads the SSE stream with `ReadableStream`, appends deltas via `useAnalyze` state
7. `ReportPanel` renders the accumulating markdown live, then filters empty sections in preview mode

### Key architectural decisions

**SSE format:** Each event is `data: {"delta":"..."}` or `data: {"done":true}` or `data: {"error":"..."}`. The buffer splitting in `lib/api.ts` handles partial chunks correctly by splitting on `\n\n` and keeping the leftover.

**Prompt caching:** `SYSTEM_PROMPT` in `backend/src/lib/promptBuilder.ts` is a constant (never changes per request) and is sent with `cache_control: { type: 'ephemeral' }`. Keep it static — any change invalidates the cache across all users.

**Templates:** Built-in templates live in `frontend/src/constants/builtinTemplates.ts` as static data. Custom templates are stored in localStorage under key `bugscribe_custom_templates` with schema `{ version: 1, templates: Template[] }`. `useTemplates` manages all CRUD; built-ins are always prepended to `allTemplates`, never persisted.

**Field types:** `FieldType = 'text' | 'textarea' | 'select' | 'multi-select' | 'file'`. The `file` type renders a dropzone in `StructuredForm` that reads text-based file contents (`.log`, `.txt`, `.json`, `.xml`, `.csv`) into the field value string, and just records filenames for binary files. Both `frontend/src/types/index.ts` and `backend/src/lib/types.ts` define this type — keep them in sync.

**Missing fields notice:** After analyzing in `structured` mode, `App.tsx` computes which non-`file` fields were left empty (comparing `selectedTemplate.fields` vs `formValues`) and passes them as `missingFields` to `ReportPanel`, which renders them in an amber panel below the report.

**Plain-text copy:** `ReportPanel` does not copy the raw markdown. It first runs `removeEmptySections()` (strips `##` sections whose body is blank/N/A/None), then `markdownToPlainText()` from `frontend/src/lib/markdownToPlainText.ts`, which converts headings to uppercase labels and strips markdown syntax. This produces Jira/Monday-ready output.

**Mode:** Only `'structured'` and `'freetext'` are valid `InputMode` values. The `'both'` mode was removed. The backend `promptBuilder.ts` builds different user prompts depending on mode, but the system prompt stays constant.

### State ownership
- `useTemplates` — all template state, localStorage persistence, selected template ID
- `useAnalyze` — report string (streamed), loading, error; exposes `updateReport` for the edit-and-save flow
- `App.tsx` — input mode, form values, free text, free text attachments, and the derived `missingFields` computation
- `Sidebar` — owns `editingTemplate` state locally (which template the modal is currently editing)

## Product Principles

- BugScribe is not a bug tracker. It is a bug writing assistant.
- The main goal is to help users create bug reports faster with minimal effort.
- The default experience should be AI-first, not form-heavy.
- Users may provide structured input, free text, or voice-derived text.
- The system must not hallucinate facts or root causes.
- If information is missing, mark it as unknown or to be confirmed.
- The output should be clear, professional, and ready to copy into external tools.
- Preview mode should hide empty sections.
- Edit mode may still expose empty fields for completion.


## AI Output Guardrails

- Do not infer root cause unless explicitly stated.
- Do not invent reproduction steps that were not provided or strongly implied.
- Do not fabricate expected behavior beyond what is grounded in the input.
- Prefer “unknown”, “not specified”, or “requires investigation” over assumptions.