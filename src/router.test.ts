import { afterEach, describe, expect, it } from "vitest";
import { createMemoryHistory } from "vue-router";
import { createAppRouter } from "./router";
import { demoUser, newcomer, storeSessionFor } from "./test/fake-api";

function signInAsDemoUser() {
	storeSessionFor(demoUser);
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

	it("sends a signed in user who has not onboarded to the onboarding first", async () => {
		storeSessionFor(newcomer);
		const router = createAppRouter(createMemoryHistory());

		await router.push("/dashboard");

		expect(router.currentRoute.value.path).toBe("/onboarding");
	});

	it("lets a user who has not onboarded open the onboarding", async () => {
		storeSessionFor(newcomer);
		const router = createAppRouter(createMemoryHistory());

		await router.push("/onboarding");

		expect(router.currentRoute.value.path).toBe("/onboarding");
	});

	it("sends a signed out visitor from the onboarding to login", async () => {
		const router = createAppRouter(createMemoryHistory());

		await router.push("/onboarding");

		expect(router.currentRoute.value.path).toBe("/login");
	});

	it("keeps public pages open to a user who has not onboarded", async () => {
		storeSessionFor(newcomer);
		const router = createAppRouter(createMemoryHistory());

		await router.push("/");

		expect(router.currentRoute.value.path).toBe("/");
	});

	it("shows the not found page for an unknown address", async () => {
		const router = createAppRouter(createMemoryHistory());

		await router.push("/this-does-not-exist");

		expect(router.currentRoute.value.matched[0]?.path).toBe("/:pathMatch(.*)*");
	});

	it("uses the app layout for the dashboard and the profile", async () => {
		signInAsDemoUser();
		const router = createAppRouter(createMemoryHistory());

		await router.push("/profile");
		expect(router.currentRoute.value.meta.layout).toBe("app");

		await router.push("/dashboard");
		expect(router.currentRoute.value.meta.layout).toBe("app");
	});

	it("keeps the public layout for the landing page and the onboarding", async () => {
		storeSessionFor(newcomer);
		const router = createAppRouter(createMemoryHistory());

		await router.push("/");
		expect(router.currentRoute.value.meta.layout).toBeUndefined();

		await router.push("/onboarding");
		expect(router.currentRoute.value.meta.layout).toBeUndefined();
	});

	it("sends a signed out visitor from the profile to login", async () => {
		const router = createAppRouter(createMemoryHistory());

		await router.push("/profile");

		expect(router.currentRoute.value.path).toBe("/login");
	});
});
