# Curation Dashboard

Thin Next.js client for the backend's `/dashboard` API. Zero business logic lives
here — every screen fetches the Nest.js backend, which owns matching, linking,
duplicate detection, and sync jobs.

The shell is a left sidebar (Queue / Matched / Duplicates / Legacy with live
count badges from `/dashboard/stats`) plus a sticky per-page top bar carrying
that page's filters and the global **Sync** menu (Rematch, Sync Lidl, Sync
Rema).

Pages:

- **/** — the curation queue: match/possible/none segmented tabs with live
  counts, store filter, search, candidate comparison rows (differing fields
  highlighted), approve/ignore. Keyboard flow: `j`/`k` or arrows select a card,
  `A` approves the pre-selected candidates, `I` ignores, `Esc` deselects.
- **/matched** — linked listings; defaults to the **Curated** view
  (`?curated=1`, manual + auto-approved) with a toggle to include the barcode
  (auto) links from the sync. Expandable rows, two-step unlink confirm.
- **/duplicates** — side-by-side duplicate pairs with differing fields
  highlighted; keep A/B or dismiss.
- **/legacy** — Rema legacy items backed by synthetic products; approve exactly
  one EAN (rename or merge, spelled out in the result toast).
- **/login** — password login (token stored in localStorage, sent as
  `Authorization: Bearer`).

All requests go through `lib/api.ts`, whose query builder omits empty/undefined
params (never send `storeType=`). Every list fetch surfaces API errors in a
banner with retry, and `app/error.tsx` catches anything that would otherwise
white-screen a page.

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
