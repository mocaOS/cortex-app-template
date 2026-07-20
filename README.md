# Cortex App Template

Build a web app that runs **inside** a [Cortex](https://github.com/mocaOS/cortex-app)
instance — installed by an admin as a single zip, no hosting required.

React + Tailwind + Vite, pre-wired with the Cortex design language and a typed
client for the app hosting contract. Building with an AI coding agent? Point it
at the builder skill first: `https://cortexskills.org/builder/app/SKILL.md`.

## The loop

```
npm install
cp .env.example .env        # add your instance URL + a read key
npm run dev                 # build against LIVE data from your instance
…edit src/, describe your app to your coding agent…
npm run package             # → {id}-{version}.zip
```

Upload the zip in your Cortex admin panel (**Apps → Install**) for a private
app, or publish it to [cortex-registry](https://github.com/mocaOS/cortex-registry)
so any instance can install it.

## The contract (read this before coding)

1. **All requests are relative.** Hosted apps are served under `/apps/{slug}/`.
   Use the client in [`src/lib/cortex.ts`](src/lib/cortex.ts) — never fetch an
   absolute `/api/…` URL. `npm run validate` enforces this.
2. **No keys in the browser, ever.** In production the hosting proxy attaches
   your app's server-side scoped key; the browser only holds a short-lived app
   token (handled for you by the client's postMessage handshake). In dev, the
   Vite proxy plays that role with `CORTEX_DEV_KEY` from `.env`.
3. **Declare what you use.** [`app.json`](app.json) lists the Cortex endpoints
   your app may call (`cortex.endpoints`), the key scope, and any external
   hosts. The admin approves exactly that at install — undeclared calls are
   blocked by the proxy.
4. **Self-contained bundle.** Hosted apps run under a strict CSP
   (`default-src 'self'`). No CDN scripts, no external fonts — ship every
   asset in `dist/`.

## What's in the box

| Path | Purpose |
|---|---|
| `app.json` | Your app's manifest — id, endpoints, scope, config vars ([schema](schema/app.v1.json)) |
| `src/lib/cortex.ts` | Typed client: `search()`, `askStream()` (SSE), `cortex()`, `platform()` |
| `src/lib/platform.ts` | Tasks + storage client: `submitTask()`, `taskAction()`, `storageGet/Put()`, … |
| `src/components/` | Demo panels exercising search + streaming Q&A with citations |
| `src/styles/index.css` | Cortex design tokens (dark-first, sharp corners, mono labels) |
| `scripts/validate.mjs` | Contract checks — run before every upload |
| `scripts/package.mjs` | Builds `{id}-{version}.zip` in the installable format |

## Manifest quick reference

```jsonc
{
  "id": "paperless-triage",          // kebab-case, unique
  "type": "static",                  // static | platform | service
  "cortex": {
    "keyScope": "read",              // read | read_write
    "endpoints": ["search", "ask"],  // /api/ paths the proxy allows
    "collections": "user-selected"
  },
  "config": [                        // admin fills these at install;
    { "name": "PAPERLESS_TOKEN",     // secrets are encrypted at rest and
      "type": "secret",              // injected SERVER-side, never shipped
      "auth_header": "Authorization: Token PAPERLESS_TOKEN" }
  ],
  "externalHosts": []                // browser-direct hosts (CSP allowlist)
}
```

`type: "platform"` unlocks server-side capabilities declared under
`capabilities`. Shipped today:

- `http` — external API calls executed by the instance with secrets injected
  from app config, so the target needs **no CORS setup** and credentials
  never reach the browser (prefer this over browser-direct `externalHosts`
  for any authenticated service).
- `tasks` — declarative step-queues (`http`/`cortex`/`llm`/`store`/`template`
  steps) that Cortex runs server-side: work survives a closed tab, and a
  `schedule` makes it recur with no browser at all. Client in
  [`src/lib/platform.ts`](src/lib/platform.ts); DSL reference:
  `cortexskills.org/builder/app/tasks.md`.
- `storage` — the app's private, quota-capped key/value store.
- `llm` — completions via the instance's model inside task steps (metered).
- Implicit config-read (`./api/platform/config`, non-secret values only).

See the builder skill for the full guide. `type: "service"` is for apps that
need their own container; those ship compose templates instead of zips.

## Design language

Dark-first, typography-led, sharp. Tokens live in `src/styles/index.css`;
the full spec is the [`cortex-design` skill](https://cortexskills.org/cortex-design/SKILL.md).
Instances can expose their own accent/logo via the platform `branding`
capability — prefer tokens over hardcoded colors so your app inherits it.
