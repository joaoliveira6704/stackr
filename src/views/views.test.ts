import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../lib/use-auth";
import { useProgressStore } from "../stores/progress";
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
import ProfileView from "./ProfileView.vue";
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
		const { wrapper } = await mountAt("/login", LoginView, "pt-PT");

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

async function signInAsDemoUser() {
	fakeUsersApi();
	await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
}

describe("DashboardView", () => {
	it("greets the user by first name", async () => {
		await signInAsDemoUser();
		const { wrapper } = await mountAt("/dashboard", DashboardView);

		expect(wrapper.text()).toContain("Hi, João");
	});

	it("shows the current level", async () => {
		await signInAsDemoUser();
		const { wrapper } = await mountAt("/dashboard", DashboardView);

		expect(wrapper.text()).toContain("Current level");
		expect(wrapper.text()).toContain("Beginner");
	});

	it("shows a card for each statistic with the values from the store", async () => {
		await signInAsDemoUser();
		const { wrapper } = await mountAt("/dashboard", DashboardView);
		const progress = useProgressStore();
		progress.addXp(1250);
		progress.addStacks(40);
		progress.completeLesson("budget-1");
		await flushPromises();

		const cards = wrapper.findAll("article").map((card) => card.text());
		expect(cards).toHaveLength(4);
		expect(cards[0]).toContain("Total XP");
		expect(cards[0]).toContain("1,250");
		expect(cards[1]).toContain("40");
		expect(cards[3]).toContain("Lessons done");
		expect(cards[3]).toContain("1");
	});

	it("does not show account details, which live on the profile", async () => {
		await signInAsDemoUser();
		const { wrapper } = await mountAt("/dashboard", DashboardView);

		expect(wrapper.text()).not.toContain(demoUser.email);
	});

	it("speaks Portuguese and formats numbers for Portugal", async () => {
		await signInAsDemoUser();
		const { wrapper } = await mountAt("/dashboard", DashboardView, "pt-PT");
		useProgressStore().addXp(1250);
		await flushPromises();

		expect(wrapper.text()).toContain("Olá, João");
		expect(wrapper.text()).toContain("Nível atual");
		// Portugal writes four digit numbers with no separator, not "1.250".
		expect(wrapper.text()).toContain("1250");
		expect(wrapper.text()).not.toContain("1.250");
	});
});

describe("ProfileView", () => {
	it("puts the account card first with the name and email", async () => {
		await signInAsDemoUser();
		const { wrapper } = await mountAt("/profile", ProfileView);

		const firstCard = wrapper.find("section");
		expect(firstCard.text()).toContain(demoUser.name);
		expect(firstCard.text()).toContain(demoUser.email);
		expect(firstCard.text()).toContain("Log out");
	});

	it("shows the track and the progress", async () => {
		await signInAsDemoUser();
		const { wrapper } = await mountAt("/profile", ProfileView);

		expect(wrapper.text()).toContain("Foundation");
		expect(wrapper.text()).toContain("Total XP");
	});

	it("signs the user out and goes home", async () => {
		await signInAsDemoUser();
		const { wrapper, router } = await mountAt("/profile", ProfileView);

		await wrapper.find("section button").trigger("click");
		await flushPromises();

		expect(useAuth().user.value).toBeNull();
		expect(router.currentRoute.value.path).toBe("/");
	});

	it("is in Portuguese by default", async () => {
		await signInAsDemoUser();
		const { wrapper } = await mountAt("/profile", ProfileView, "pt-PT");

		expect(wrapper.text()).toContain("Perfil");
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
		const { wrapper } = await mountAt("/", HomeView, "pt-PT");

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
		const { wrapper } = await mountAt("/nowhere", NotFoundView, "pt-PT");

		expect(wrapper.text()).toContain("Voltar ao início");
	});
});
