# Candy (Candy Meds)

A local-first medication reminder React Native app: manage meds by breakfast / lunch / dinner / bedtime slots, show a **pending intake** list after each scheduled time, and use system notifications when permission is granted.

**[简体中文](README.zh-CN.md)**

## Features

- **Medications**: Add, edit, and delete entries. Duplicates are blocked when name, time slots, dosage, and icon all match an existing entry.
- **Time slots**: Each medication can use any combination of breakfast, lunch, dinner, and bedtime; dosage presets from ¼ to 6 tablets.
- **Icons**: Emoji or uploaded image per medication.
- **Pending intake**: After the current time passes your configured meal/bedtime for a slot, matching medications appear in the pending list. Marking **taken** prevents the same item from reappearing that day. Entries left unhandled for about 6 hours are removed automatically.
- **Notifications**: At each slot’s scheduled minute, if notification permission is granted, a local push reminder is shown, with a random line from the `@candy/copy` package in the body.
- **Settings**: Light / dark / system theme; Chinese / English (device language when no preference is stored); per-slot times for the four periods; one-click clear of all local data.

## Stack

- **App**: Expo + React Native + TypeScript.
- **Repo**: pnpm workspace; use **pnpm** as the package manager.

## Repository layout

| Path | Role |
|------|------|
| `apps/candy-native` | Mobile app (Expo / React Native) |
| `packages/candy-shared` | Shared types and i18n message JSON |
| `packages/copy` | Random reminder copy (CN/EN JSON) for notification text |

## Development

From the repository root:

```bash
pnpm install
```

- **Start Metro**: `pnpm native:start`
- **Run iOS**: `pnpm native:ios`
- **Run Android**: `pnpm native:android`
- **Typecheck**: `pnpm native:typecheck`

---

Originally built as a simple nudge to take medicine on time.
