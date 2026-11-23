import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	server: {
		// json-server writes db.json on every change, which must not reload the app.
		// The API writes to db/db.json on every save, which would reload the page.
		watch: { ignored: ["**/db/**"] },
		// json-server (bun run api) runs on 3001; the app always talks to /api/*
		proxy: {
			"/api": {
				target: "http://localhost:3001",
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
			// Yahoo Finance has no CORS headers, so the browser reaches it through
			// the dev server. The public endpoints need no key, only a browser
			// like User-Agent.
			"/market": {
				target: "https://query1.finance.yahoo.com",
				changeOrigin: true,
				headers: { "User-Agent": "Mozilla/5.0" },
				rewrite: (path) => path.replace(/^\/market/, ""),
			},
		},
	},
	plugins: [
		tailwindcss(),
		vue({
			// Files in public/ are served from the root as they are, so a path
			// like "/hero-image.png" stays a plain URL instead of an import. As
			// an import it also breaks the tests on Windows.
			template: { transformAssetUrls: { includeAbsolute: false } },
		}),
	],
	test: {
		environment: "jsdom",
		// Builds jsdom once per worker instead of once per test file, while
		// still running each file in its own context, so module state such as
		// the signed in user cannot leak from one file into the next.
		pool: "vmThreads",
		setupFiles: ["src/test/setup.ts"],
		// Only there to answer "bun test" with a helpful message, see bunfig.toml.
		exclude: [...configDefaults.exclude, "tooling/**"],
	},
});
