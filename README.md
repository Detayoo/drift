# Drift

Send files directly between your devices. No cloud. No account. Just your network.

What works now: same-device and device-to-device transfers with resume, pairing with trust, automatic nearby discovery over UDP, and pickup links any browser can download.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Phone testing always runs against a production build (`npm run build`, then `next start`), never the dev server.

## Checks

```bash
npm run typecheck
npm run guard
npm run build
npm run bench
```

## Layout

```text
src/app              routes, page shell, tokens in globals.css
src/components/primitives   the only files allowed raw HTML tags
src/components       reusable UI (buttons, dialog, toast, palette, tabs, states)
src/screens          page screens
src/server           protocol state (offers, pairing, trust, discovery, resume)
src/lib              client helpers (upload engine, invite, pairing, http)
project-doc          full spec + design system (local only, never committed)
```

## Rules

All rectangles are Box. All text is AppText. No shadows, borders do the work.
Tabler icons only. Tokens only, never raw hex.
Docs (`*.md`, `project-doc`, local data dirs) stay local and are never committed.
After touching a TS file, de-slop it, then typecheck.
