import { afterEach, describe, expect, it } from "vitest";
import { createMemoryHistory } from "vue-router";
import { createAppRouter } from "./router";

function signInAsDemoUser() {
	localStorage.setItem(
		"stackr.session",
		JSON.stringify({
			id: "1",
			name: "João Oliveira",
			email: "joao@example.com",
		}),
	);
}

afterEach(() => {
	localStorage.clear();
});

describe("router", () => {
	it("sends a signed out visitor from the dashboard to login and remembers where they were going", async () => {
		const router = createAppRouter(createMemoryHistory());

		await router.push("/dashboard");

		expect(router.currentRoute.value.path).toBe("/login");
		expect(router.currentRoute.value.query.redirect).toBe("/dashboard");
	});

	it("lets a signed in user open the dashboard", async () => {
		signInAsDemoUser();
		const router = createAppRouter(createMemoryHistory());

		await router.push("/dashboard");

		expect(router.currentRoute.value.path).toBe("/dashboard");
	});

	it("lets anyone open the public pages", async () => {
		const router = createAppRouter(createMemoryHistory());

		await router.push("/signup");

		expect(router.currentRoute.value.path).toBe("/signup");
	});
});
