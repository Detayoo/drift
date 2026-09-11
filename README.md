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
