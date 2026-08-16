# GymDiary – instructions for AI contributors

This repository contains a Czech static training diary. Read `README.md` and `docs/AI_HANDOFF.md` before editing.

Keep the mobile-first layout and the existing dark, yellow-accented visual system. Preserve Czech UI copy and the established tab structure. Do not migrate technologies, add a backend, alter plan dates, change 1RM goals, or delete user workout records unless the user explicitly requests it.

The 16-week plan lives in `client/src/lib/data.ts`. Exercise records currently use browser localStorage, so never claim that local data are automatically backed up or recoverable. When changing plan weights, show the calculation logic before modifying data if the request requires user approval.

Use pnpm. Before proposing a finished change, run `pnpm check`. Keep each pull request narrow and explain its scope, verification, and any remaining limitation.
