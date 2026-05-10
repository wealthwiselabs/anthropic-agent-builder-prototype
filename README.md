# Anthropic Agent Builder — Prototype

A click-through prototype for the **Unified Agent-Building Surface** proposal (idea M1 in the Anthropic Growth PM take-home). The prototype demonstrates a single Console surface where the build experience is identical for managed and self-hosted users; divergence happens only at deploy.

> Spec: see `M1_Prototype_Spec.md` in the take-home repo.

## What's real vs. mocked

- **Real:** the routes, the React Flow canvas, the templates, the chat-input keyword routing, the `.zip` download, the codegen.
- **Mocked:** all "AI" (chat copilot is scripted, Code view is deterministic templating, no real LLM call). Deploy success states are visual mocks; the GitHub link points to a sample scaffold repo so it doesn't 404.

## Local development

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # static bundle in dist/
```

## Deployment

Pushed to `main` → GitHub Action builds and publishes via `actions/deploy-pages@v4`. Live URL: `https://<username>.github.io/anthropic-agent-builder-prototype/`.

## Stack

Vite · React 19 · TypeScript · Tailwind v3 · React Router v6 · Zustand · `@xyflow/react` · JSZip · Shiki · Lucide.

## Disclaimer

Prototype for an Anthropic Growth PM take-home — **not affiliated with Anthropic**.
