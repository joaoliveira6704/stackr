import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory } from "vue-router";
import { useAuth } from "../lib/use-auth";
import { createAppRouter } from "../router";
import {
	DEMO_PASSWORD,
	demoUser,
	fakeUsersApi,
	jsonResponse,
} from "../test/fake-api";
import DashboardView from "./DashboardView.vue";
import HomeView from "./HomeView.vue";
import LoginView from "./LoginView.vue";
import SignupView from "./SignupView.vue";

async function mountAt(path: string, component: object) {
	const router = createAppRouter(createMemoryHistory());
	await router.push(path);
	const wrapper = mount(component, { global: { plugins: [router] } });
	return { wrapper, router };
}

afterEach(() => {
	useAuth().signOut();
	vi.unstubAllGlobals();
});

describe("LoginView", () => {
	it("signs in and goes to the page the user was sent from", async () => {
		fakeUsersApi();
		const { wrapper, router } = await mountAt(
			"/login?redirect=/dashboard",
			LoginView,
		);

		await wrapper.find('input[type="email"]').setValue(demoUser.email);
		await wrapper.find('input[type="password"]').setValue(DEMO_PASSWORD);
		await wrapper.find("form").trigger("submit");
		await vi.waitFor(() =>
			expect(router.currentRoute.value.path).toBe("/dashboard"),
		);

		expect(useAuth().user.value?.email).toBe(demoUser.email);
	});

	it("goes home instead of following an external redirect", async () => {
		fakeUsersApi();
		const { wrapper, router } = await mountAt(
			"/login?redirect=//evil.example",
			LoginView,
		);

		await wrapper.find('input[type="email"]').setValue(demoUser.email);
		await wrapper.find('input[type="password"]').setValue(DEMO_PASSWORD);
		await wrapper.find("form").trigger("submit");
		await vi.waitFor(() => expect(useAuth().user.value).not.toBeNull());
		await flushPromises();

		expect(router.currentRoute.value.fullPath).toBe("/");
	});

	it("shows the error and stays on the page when the password is wrong", async () => {
		fakeUsersApi();
		const { wrapper, router } = await mountAt("/login", LoginView);

		await wrapper.find('input[type="email"]').setValue(demoUser.email);
		await wrapper.find('input[type="password"]').setValue("wrong");
		await wrapper.find("form").trigger("submit");
		await vi.waitFor(() =>
			expect(wrapper.text()).toContain("Invalid email or password."),
		);

		expect(router.currentRoute.value.path).toBe("/login");
	});
});

describe("SignupView", () => {
	it("stops before calling the API when the passwords do not match", async () => {
		const fetchMock = fakeUsersApi();
		const { wrapper } = await mountAt("/signup", SignupView);

		const [password, confirm] = wrapper.findAll('input[type="password"]');
		await password.setValue("first");
		await confirm.setValue("second");
		await wrapper.find("form").trigger("submit");

		expect(wrapper.text()).toContain("Passwords do not match.");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("creates the account and opens the dashboard", async () => {
		fakeUsersApi();
		const { wrapper, router } = await mountAt("/signup", SignupView);

		await wrapper.find('input[autocomplete="name"]').setValue("Maria Silva");
		await wrapper.find('input[type="email"]').setValue("maria@example.com");
		for (const input of wrapper.findAll('input[type="password"]')) {
			await input.setValue("segredo");
		}
		await wrapper.find("form").trigger("submit");
		await vi.waitFor(() =>
			expect(router.currentRoute.value.path).toBe("/dashboard"),
		);

		expect(useAuth().user.value?.name).toBe("Maria Silva");
	});
});

describe("DashboardView", () => {
	it("shows the signed in user and signs them out", async () => {
		fakeUsersApi();
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
		const { wrapper, router } = await mountAt("/dashboard", DashboardView);

		expect(wrapper.text()).toContain(demoUser.name);
		expect(wrapper.text()).toContain(demoUser.email);

		await wrapper.find("button").trigger("click");
		await flushPromises();

		expect(useAuth().user.value).toBeNull();
		expect(router.currentRoute.value.path).toBe("/");
	});
});

describe("HomeView", () => {
	it("lists the users from the API", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => jsonResponse([demoUser])),
		);
		const { wrapper } = await mountAt("/", HomeView);
		await flushPromises();

		expect(wrapper.text()).toContain(`Name: ${demoUser.name}`);
	});

	it("explains how to start the API when it cannot load users", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => jsonResponse({}, 500)),
		);
		const { wrapper } = await mountAt("/", HomeView);
		await flushPromises();

		expect(wrapper.text()).toContain("Is json-server running?");
	});
});
