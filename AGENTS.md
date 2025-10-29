# Agent Notes

This file summarizes the guidance given throughout the conversation for future agents working on this project.

## General Expectations

- Work within the `google-authenticator-export-decoder` project (React + TypeScript + Vite).
- Prefer PNPM commands (`pnpm dev`, `pnpm build`, `pnpm test:once`, etc.).
- Tests should be run with `pnpm test:once` to avoid watch mode.

## Styling & UX Guidance

- UI uses Tailwind classes via `@tailwindcss/vite`; maintain the existing aesthetic (teal gradients, rounded cards).
- Instructions are delivered via tooltips using the `InfoTooltip` component; do not reintroduce static instruction blocks.
- Account cards must wrap long Base32 secrets (implemented with `break-all` and background styling).
- GitHub button in the sidebar links to the project repository and uses `public/github-mark-white.svg`.
- Trust section highlights "Privacy Focused", "Completely Offline", "Transparent Process", and "Open Source".

## Testing & Fixtures

- Unit tests live in `src/**/*.test.ts`; fixtures are in `src/test-fixtures/`.
- `tsconfig.app.json` allows JSON imports and Vitest globals.
- Coverage reporters are enabled (text + HTML) in `vitest.config.ts`.

## Deployment

- GitHub Actions workflow (`.github/workflows/deploy.yml`) builds with PNPM and deploys to GitHub Pages on pushes to `main`.
- Site metadata and favicon are configured via `index.html` (title + description + `/favicon.ico`).

## Licensing & Docs

- Project is MIT licensed; README contains Notice, live demo link, star request, setup, usage, trust statements, and references.

