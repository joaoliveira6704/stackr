import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { useAuth } from "../lib/use-auth";
import { useTheme } from "../lib/use-theme";
import { DEMO_PASSWORD, demoUser, fakeUsersApi } from "../test/fake-api";
import { mountAt } from "../test/mount";
import AppSidebar from "./AppSidebar.vue";

afterEach(() => {
	useAuth().signOut();
	useTheme().setTheme("light");
	localStorage.clear();
});

async function mountSidebar(
	path = "/dashboard",
	locale: "pt-PT" | "en" = "en",
) {
	fakeUsersApi();
	await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
	return mountAt(path, AppSidebar, locale);
}

function buttonNamed(
	wrapper: Awaited<ReturnType<typeof mountSidebar>>["wrapper"],
	label: string,
) {
	const button = wrapper
		.findAll("button")
		.find((candidate) => candidate.text().includes(label));
	if (!button) throw new Error(`No button labelled ${label}`);
	return button;
}

describe("AppSidebar", () => {
	it("links to the dashboard and the profile", async () => {
		const { wrapper } = await mountSidebar();

		const links = wrapper.findAll("a").map((link) => link.attributes("href"));
		expect(links).toContain("/dashboard");
		expect(links).toContain("/profile");
	});

	it("marks the page the user is on", async () => {
		const { wrapper } = await mountSidebar("/profile");

		const current = wrapper.find('[aria-current="page"]');
		expect(current.attributes("href")).toBe("/profile");
	});

	it("keeps every label in the page so screen readers can read it", async () => {
		const { wrapper } = await mountSidebar();

		expect(wrapper.text()).toContain("Dashboard");
		expect(wrapper.text()).toContain("Profile");
		expect(wrapper.text()).toContain("Log out");
	});

	it("switches the language to the other one", async () => {
		const { wrapper } = await mountSidebar("/dashboard", "en");

		await buttonNamed(wrapper, "Português").trigger("click");

		expect(localStorage.getItem("stackr.locale")).toBe("pt-PT");
		expect(wrapper.text()).toContain("Painel");
	});

	it("switches the theme", async () => {
		useTheme().setTheme("light");
		const { wrapper } = await mountSidebar();

		await buttonNamed(wrapper, "Switch to dark mode").trigger("click");

		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("signs the user out and goes home", async () => {
		const { wrapper, router } = await mountSidebar();

		await buttonNamed(wrapper, "Log out").trigger("click");
		await flushPromises();

		expect(useAuth().user.value).toBeNull();
		expect(router.currentRoute.value.path).toBe("/");
	});

	it("labels the navigation in Portuguese", async () => {
		const { wrapper } = await mountSidebar("/dashboard", "pt-PT");

		expect(wrapper.find("nav").attributes("aria-label")).toBe(
			"Navegação principal",
		);
		expect(wrapper.text()).toContain("Perfil");
	});

	describe("preferences menu on phones", () => {
		function preferencesButton(
			wrapper: Awaited<ReturnType<typeof mountSidebar>>["wrapper"],
		) {
			return wrapper.get('button[aria-controls="preferences-menu"]');
		}

		it("starts closed", async () => {
			const { wrapper } = await mountSidebar();

			expect(preferencesButton(wrapper).attributes("aria-expanded")).toBe(
				"false",
			);
			expect(wrapper.find("#preferences-menu").exists()).toBe(false);
		});

		it("opens with the language, theme and logout options", async () => {
			const { wrapper } = await mountSidebar();

			await preferencesButton(wrapper).trigger("click");

			const menu = wrapper.get("#preferences-menu");
			expect(preferencesButton(wrapper).attributes("aria-expanded")).toBe(
				"true",
			);
			expect(menu.text()).toContain("Português");
			expect(menu.text()).toContain("Switch to dark mode");
			expect(menu.text()).toContain("Log out");
		});

		it("runs the chosen option and closes", async () => {
			useTheme().setTheme("light");
			const { wrapper } = await mountSidebar();
			await preferencesButton(wrapper).trigger("click");

			const themeOption = wrapper
				.get("#preferences-menu")
				.findAll("button")
				.find((option) => option.text().includes("dark mode"));
			await themeOption?.trigger("click");

			expect(document.documentElement.classList.contains("dark")).toBe(true);
			expect(wrapper.find("#preferences-menu").exists()).toBe(false);
		});

		it("closes when Escape is pressed", async () => {
			const { wrapper } = await mountSidebar();
			await preferencesButton(wrapper).trigger("click");

			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
			await flushPromises();

			expect(wrapper.find("#preferences-menu").exists()).toBe(false);
		});

		it("closes when the user goes to another page", async () => {
			const { wrapper, router } = await mountSidebar("/dashboard");
			await preferencesButton(wrapper).trigger("click");

			await router.push("/profile");
			await flushPromises();

			expect(wrapper.find("#preferences-menu").exists()).toBe(false);
		});

		it("is labelled in Portuguese", async () => {
			const { wrapper } = await mountSidebar("/dashboard", "pt-PT");

			expect(preferencesButton(wrapper).text()).toContain("Preferências");
		});
	});
});
