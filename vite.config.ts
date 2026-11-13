import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	server: {
		// json-server writes db.json on every change, which must not reload the app.
		watch: { ignored: ["**/db/**"] },
		// json-server (bun run api) runs on 3001; the app always talks to /api/*
		proxy: {
			"/api": {
				target: "http://localhost:3001",
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
	plugins: [tailwindcss(), vue()],
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
