---
name: compact
description: >
  Triggered ONLY when the user says "COMPACT" (all caps, exactly).
  Summarizes the entire conversation into 5–7 bullet points with all critical
  context, decisions, and code snippets — formatted for copy-paste into a new chat.
  Use this skill immediately whenever "COMPACT" appears in the user's message,
  with no clarifying questions.
---

# COMPACT Skill

Triggered when the user types **COMPACT** (all caps).

## Output Format

Produce a single fenced markdown block (` ```md `) containing **5–7 bullet points**. Each bullet must be dense and self-contained — a new Claude session reading only these bullets should be able to continue exactly where this one left off.

## What to Include Per Bullet

Cover all of the following across the 5–7 bullets (combine where they overlap):

1. **Project identity** — stack, repo, deploy targets, key services, business model
2. **Current sprint / task state** — sprint name, which tasks are done ✅, in-progress 🔄, blocked ❌
3. **Key decisions made** — architecture choices, rejected options, rationale
4. **Critical code patterns** — schema snippets, hook names, API shapes, file paths, naming conventions, absolute rules (e.g. "never migrate dev", "imports always relative")
5. **Active files & what changed** — list every file modified in this session with a one-line summary
6. **Known bugs / pending issues** — exact bug descriptions and reproduction steps if discussed
7. **Next steps** — the very next task(s) to execute, with enough context to start immediately

## Rules

- **No prose.** Every line is a bullet or sub-bullet. No paragraphs.
- **Be ruthless with code.** Include exact field names, type signatures, endpoint paths, env vars, and Prisma model names — not vague descriptions.
- **Preserve commands.** Any `npx`, `git`, or bash commands discussed must appear verbatim.
- **Decisions > descriptions.** "Chose URL-based logo upload now; S3 upload in Sprint 8" beats "logo upload discussed".
- **No headers** outside the fenced block. The entire output is the copy-pasteable block.
- **Length target:** 400–600 words inside the block. Dense but scannable.

## Template

````md
# Context Dump — [Project Name] — [Date]

- **Stack & Deploy:** [frontend stack + path] · [backend stack + path] · [DB] · [hosting] · [key services]
- **Sprint [X] status:** [done tasks ✅] · [in-progress 🔄] · [pending ❌]
- **Key decisions:** [decision 1] · [decision 2] · [rejected: X because Y]
- **Absolute rules:** [rule 1] · [rule 2] · [rule 3]
- **Files changed this session:**
  - `path/to/file.ts` — [what changed]
  - `path/to/other.tsx` — [what changed]
- **Active schema/API:** [relevant models, endpoints, types]
- **Bugs / blockers:** [bug 1 with repro] · [bug 2]
- **Next:** [exact next task with enough context to start]
  ```bash
  [any required commands]
  ```
````

## Behavior

1. Read the entire conversation history
2. Extract all decisions, file changes, patterns, and pending items
3. Output **only** the fenced block — no preamble, no explanation
4. If conversation is very short (< 5 exchanges), say: "Not enough context to compact yet — continue working and try again."
