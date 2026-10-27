import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	server: {
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
		setupFiles: ["src/test/setup.ts"],
	},
});
