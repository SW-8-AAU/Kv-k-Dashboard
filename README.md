# Curation Dashboard

Thin Next.js client for the backend's `/dashboard` API. Zero business logic lives
here — every screen fetches the Nest.js backend, which owns matching, linking,
duplicate detection, and sync jobs.

Pages:

- **/** — the curation queue: per-store/bucket stats, match/possible/none tabs,
  search, candidate selection (checkboxes + custom EAN), approve/ignore.
- **/matched** — linked listings with their products; unlink.
- **/duplicates** — side-by-side duplicate pairs; keep A/B or dismiss.
- **/legacy** — Rema legacy items backed by synthetic products; approve exactly
  one EAN (rename or merge).
- **/login** — password login (token stored in localStorage, sent as
  `Authorization: Bearer`).

## Environment

| Variable              | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend, e.g. `https://api-dev.todua.dk` (no trailing slash). |

Copy `.env.example` to `.env` and adjust.

## Develop / build

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
```

## Deploy (Coolify)

Deploy as a Node.js Next.js app. Set `NEXT_PUBLIC_API_URL` at **build time**
(it is inlined into the client bundle). The backend must have
`DASHBOARD_PASSWORD` and `DASHBOARD_JWT_SECRET` configured, otherwise login
answers 503.
