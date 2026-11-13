# Stackr

Stackr is a small finance web app built with Vue 3, Vue Router, Vite and Tailwind CSS. A mock API runs on json-server and reads from `db/db.json`.

## Getting started

Install the dependencies once.

```bash
bun install
```

Start the mock API and the app together with one command, then open http://localhost:3000. Stopping it with Ctrl+C stops both.

```bash
bun run dev:all
```

You can also run them separately. Start the mock API in one terminal. It listens on port 3001.

```bash
bun run api
```

Start the app in another terminal and open http://localhost:3000. The dev server forwards every `/api` request to json-server. You can log in with the demo account `joao@example.com` and the password `123456`.

```bash
bun run dev
```

## Tests

Unit tests use Vitest and Vue Test Utils and run in jsdom. They never call the real API, so json-server does not need to be running. Run them with `bun run test`. Plain `bun test` starts Bun's own test runner instead, which cannot run these tests, so it only prints a reminder to use `bun run test`.

```bash
bun run test
```

## Building

The build type checks the Vue files with vue-tsc first, then bundles the app into `dist`.

```bash
bun run build
```

## Linting and formatting

The project uses Biome, which also understands the templates in `.vue` files.

```bash
bun run check
```

## Project layout

Pages live in `src/views` and are wired up in `src/router.ts`. A route with `meta: { requiresAuth: true }` sends signed out visitors to the login page and brings them back after they log in. Shared pieces of UI go in `src/components`. The auth logic is in `src/lib/auth.ts`, and components read the signed in user through the `useAuth` composable in `src/lib/use-auth.ts`.

A signed in user who has not finished the onboarding is sent to `/onboarding` first. The six questions are defined in `src/lib/onboarding.ts`, which also turns the answers into a track, and the result is saved on the user in `db.json`. Shared progress such as XP lives in the Pinia store in `src/stores/progress.ts`.

## Languages

The app speaks Portuguese by default and English as a second language, using vue-i18n. All interface text lives in `src/i18n/pt.ts` and `src/i18n/en.ts`, and the English file is typed against the Portuguese one, so a missing key fails the type check. Errors are thrown with a code from `src/lib/errors.ts` and translated on screen. The language picked in the header is remembered in the browser.
