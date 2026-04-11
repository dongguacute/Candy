# Candy (Candy Meds)

A local-first medication reminder web app: manage meds by breakfast / lunch / dinner / bedtime slots, show a **pending intake** list after each scheduled time, and optionally use system notifications when permission is granted. Data stays in the browser (`localStorage`); installable as a PWA for offline use.

**[简体中文](README.zh-CN.md)**

## Features

- **Medications**: Add, edit, and delete entries. Duplicates are blocked when name, time slots, dosage, and icon all match an existing entry.
- **Time slots**: Each medication can use any combination of breakfast, lunch, dinner, and bedtime; dosage presets from ¼ to 6 tablets.
- **Icons**: Emoji or uploaded image per medication.
- **Pending intake**: After the current time passes your configured meal/bedtime for a slot, matching medications appear in the pending list. Marking **taken** prevents the same item from reappearing that day. Entries left unhandled for about 6 hours are removed automatically.
- **Notifications**: At each slot’s scheduled minute, if notification permission is granted, a reminder is shown via the service worker, with a random line from the `@candy/copy` package in the body.
- **Settings**: Light / dark / system theme; Chinese / English (browser language when no preference is stored); per-slot times for the four periods; one-click clear of all local data.

## Stack

- **App**: Next.js (`pages` router), React 19, Tailwind CSS 4, TypeScript.
- **Build**: Static export (`output: "export"`), **PWA** via `next-pwa` in production.
- **Repo**: pnpm workspace + Turborepo; use **pnpm** as the package manager.

## Repository layout

| Path | Role |
|------|------|
| `apps/candy` | Main app: pages, layout, context, local persistence |
| `packages/copy` | Random reminder copy (CN/EN JSON) for notification text |

## Development

From the repository root:

```bash
pnpm install
```

- **Dev**: `pnpm dev` (runs the Next dev server for `apps/candy` via Turbo at the root).
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`

PWA is usually disabled in development; use a production build on a static host to verify install and offline behavior.

---

Originally built as a simple nudge to take medicine on time.
