import { test } from "bun:test";

test("this project runs its tests with Vitest", () => {
	throw new Error(
		'Use "bun run test" instead of "bun test". The tests need Vitest, jsdom and the Vue plugin, which Bun\'s built in runner does not provide.',
	);
});
