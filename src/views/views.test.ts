import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../lib/use-auth";
import {
	DEMO_PASSWORD,
	demoUser,
	fakeUsersApi,
	newcomer,
} from "../test/fake-api";
import { mountAt } from "../test/mount";
import DashboardView from "./DashboardView.vue";
import HomeView from "./HomeView.vue";
import LoginView from "./LoginView.vue";
import NotFoundView from "./NotFoundView.vue";
import SignupView from "./SignupView.vue";

afterEach(() => {
	useAuth().signOut();
	localStorage.clear();
	vi.unstubAllGlobals();
});

async function logIn(
	wrapper: Awaited<ReturnType<typeof mountAt>>["wrapper"],
	email: string,
	password: string,
) {
	await wrapper.find('input[type="email"]').setValue(email);
	await wrapper.find('input[type="password"]').setValue(password);
	await wrapper.find("form").trigger("submit");
}

describe("LoginView", () => {
	it("signs in and goes to the page the user was sent from", async () => {
		fakeUsersApi();
		const { wrapper, router } = await mountAt(
			"/login?redirect=/dashboard",
			LoginView,
		);

		await logIn(wrapper, demoUser.email, DEMO_PASSWORD);
		await vi.waitFor(() =>
			expect(router.currentRoute.value.path).toBe("/dashboard"),
		);

		expect(useAuth().user.value?.email).toBe(demoUser.email);
	});

	it("sends a user who has not onboarded to the onboarding after login", async () => {
		fakeUsersApi();
		const { wrapper, router } = await mountAt(
			"/login?redirect=/dashboard",
			LoginView,
		);

		await logIn(wrapper, newcomer.email, DEMO_PASSWORD);
		await vi.waitFor(() =>
			expect(router.currentRoute.value.path).toBe("/onboarding"),
		);
	});

	it("goes home instead of following an external redirect", async () => {
		fakeUsersApi();
		const { wrapper, router } = await mountAt(
			"/login?redirect=//evil.example",
			LoginView,
		);

		await logIn(wrapper, demoUser.email, DEMO_PASSWORD);
		await vi.waitFor(() => expect(useAuth().user.value).not.toBeNull());
		await flushPromises();

		expect(router.currentRoute.value.fullPath).toBe("/");
	});

	it("shows the error and stays on the page when the password is wrong", async () => {
		fakeUsersApi();
		const { wrapper, router } = await mountAt("/login", LoginView);

		await logIn(wrapper, demoUser.email, "wrong");
		await vi.waitFor(() =>
			expect(wrapper.text()).toContain("Invalid email or password."),
		);

		expect(router.currentRoute.value.path).toBe("/login");
	});

	it("shows the error in Portuguese when the app is in Portuguese", async () => {
		fakeUsersApi();
		const { wrapper } = await mountAt("/login", LoginView, "pt");

		await logIn(wrapper, demoUser.email, "wrong");

		await vi.waitFor(() =>
			expect(wrapper.text()).toContain("Email ou palavra-passe incorretos."),
		);
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

	it("creates the account and opens the onboarding", async () => {
		fakeUsersApi();
		const { wrapper, router } = await mountAt("/signup", SignupView);

		await wrapper.find('input[autocomplete="name"]').setValue("Maria Silva");
		await wrapper.find('input[type="email"]').setValue("maria@example.com");
		for (const input of wrapper.findAll('input[type="password"]')) {
			await input.setValue("segredo");
		}
		await wrapper.find("form").trigger("submit");
		await vi.waitFor(() =>
			expect(router.currentRoute.value.path).toBe("/onboarding"),
		);

		expect(useAuth().user.value?.name).toBe("Maria Silva");
	});
});

describe("DashboardView", () => {
	it("shows the signed in user with their track and signs them out", async () => {
		fakeUsersApi();
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
		const { wrapper, router } = await mountAt("/dashboard", DashboardView);

		expect(wrapper.text()).toContain(demoUser.name);
		expect(wrapper.text()).toContain(demoUser.email);
		expect(wrapper.text()).toContain("Foundation");
		expect(wrapper.text()).toContain("Hi, João");

		await wrapper.find("button").trigger("click");
		await flushPromises();

		expect(useAuth().user.value).toBeNull();
		expect(router.currentRoute.value.path).toBe("/");
	});
});

describe("DashboardView in Portuguese", () => {
	it("greets the user and shows the level in Portuguese", async () => {
		fakeUsersApi();
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
		const { wrapper } = await mountAt("/dashboard", DashboardView, "pt");

		expect(wrapper.text()).toContain("Olá, João");
		expect(wrapper.text()).toContain("Iniciante");
		expect(wrapper.text()).toContain("Fundação");
	});
});

describe("HomeView", () => {
	it("invites a visitor to sign up or log in", async () => {
		const { wrapper } = await mountAt("/", HomeView);

		const links = wrapper.findAll("a").map((link) => link.attributes("href"));
		expect(links).toContain("/signup");
		expect(links).toContain("/login");
	});

	it("presents the three tracks", async () => {
		const { wrapper } = await mountAt("/", HomeView);

		expect(wrapper.text()).toContain("Foundation");
		expect(wrapper.text()).toContain("Strategist");
		expect(wrapper.text()).toContain("Arena");
	});

	it("points a signed in user to the dashboard instead of sign up", async () => {
		fakeUsersApi();
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
		const { wrapper } = await mountAt("/", HomeView);

		const links = wrapper.findAll("a").map((link) => link.attributes("href"));
		expect(links).toContain("/dashboard");
		expect(links).not.toContain("/signup");
	});

	it("is in Portuguese by default", async () => {
		const { wrapper } = await mountAt("/", HomeView, "pt");

		expect(wrapper.text()).toContain("Começar agora");
		expect(wrapper.text()).toContain("Fundação");
	});
});

describe("NotFoundView", () => {
	it("explains the page is missing and links back home", async () => {
		const { wrapper } = await mountAt("/nowhere", NotFoundView);

		expect(wrapper.text()).toContain("This page got lost along the way.");
		expect(wrapper.find('a[href="/"]').exists()).toBe(true);
		expect(wrapper.find('img[src="/404.png"]').attributes("alt")).not.toBe("");
	});

	it("is in Portuguese by default", async () => {
		const { wrapper } = await mountAt("/nowhere", NotFoundView, "pt");

		expect(wrapper.text()).toContain("Voltar ao início");
	});
});
