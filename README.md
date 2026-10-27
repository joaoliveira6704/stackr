# Stackr

Stackr is a small finance web app built with Vue 3, Vue Router, Vite and Tailwind CSS. A mock API runs on json-server and reads from `db/db.json`.

## Getting started

Install the dependencies once.

```bash
bun install
```

Start the mock API in one terminal. It listens on port 3001.

```bash
bun run api
```

Start the app in another terminal and open http://localhost:3000. The dev server forwards every `/api` request to json-server. You can log in with the demo account `joao@example.com` and the password `123456`.

```bash
bun run dev
```

## Tests

Unit tests use Vitest and Vue Test Utils and run in jsdom. They never call the real API, so json-server does not need to be running.

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
