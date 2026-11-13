import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { useAuth } from "../lib/use-auth";
import { useTheme } from "../lib/use-theme";
import { DEMO_PASSWORD, demoUser, fakeUsersApi } from "../test/fake-api";
import { answerConfirmDialog, mountAt } from "../test/mount";
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

	it("shows dark mode as a switch that is off in the light theme", async () => {
		useTheme().setTheme("light");
		const { wrapper } = await mountSidebar();

		const darkMode = wrapper.get('nav [role="switch"]');
		expect(darkMode.text()).toContain("Dark mode");
		expect(darkMode.attributes("aria-checked")).toBe("false");
	});

	it("turns dark mode on and flips the switch", async () => {
		useTheme().setTheme("light");
		const { wrapper } = await mountSidebar();

		await wrapper.get('nav [role="switch"]').trigger("click");

		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(wrapper.get('nav [role="switch"]').attributes("aria-checked")).toBe(
			"true",
		);
	});

	it("keeps the same label whether dark mode is on or off", async () => {
		useTheme().setTheme("dark");
		const { wrapper } = await mountSidebar();

		const darkMode = wrapper.get('nav [role="switch"]');
		expect(darkMode.text()).toContain("Dark mode");
		expect(darkMode.attributes("aria-checked")).toBe("true");
	});

	it("asks before logging out and signs out once confirmed", async () => {
		const { wrapper, router } = await mountSidebar();

		await buttonNamed(wrapper, "Log out").trigger("click");
		await flushPromises();

		expect(wrapper.get('[role="alertdialog"]').text()).toContain("Log out?");
		expect(useAuth().user.value).not.toBeNull();

		await answerConfirmDialog(wrapper, "confirm");

		expect(useAuth().user.value).toBeNull();
		expect(router.currentRoute.value.path).toBe("/");
	});

	it("keeps the user signed in when they cancel the logout", async () => {
		const { wrapper, router } = await mountSidebar();

		await buttonNamed(wrapper, "Log out").trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "cancel");

		expect(useAuth().user.value).not.toBeNull();
		expect(router.currentRoute.value.path).toBe("/dashboard");
		expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);
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
			expect(menu.text()).toContain("Dark mode");
			expect(menu.text()).toContain("Log out");
		});

		it("runs an action such as logout and closes", async () => {
			const { wrapper, router } = await mountSidebar();
			await preferencesButton(wrapper).trigger("click");

			const logout = wrapper
				.get("#preferences-menu")
				.findAll("button")
				.find((option) => option.text().includes("Log out"));
			await logout?.trigger("click");
			await flushPromises();

			expect(wrapper.find("#preferences-menu").exists()).toBe(false);
			await answerConfirmDialog(wrapper, "confirm");

			expect(useAuth().user.value).toBeNull();
			expect(router.currentRoute.value.path).toBe("/");
		});

		it("flips the dark mode switch and stays open so the change is visible", async () => {
			useTheme().setTheme("light");
			const { wrapper } = await mountSidebar();
			await preferencesButton(wrapper).trigger("click");

			await wrapper.get('#preferences-menu [role="switch"]').trigger("click");

			expect(document.documentElement.classList.contains("dark")).toBe(true);
			expect(
				wrapper
					.get('#preferences-menu [role="switch"]')
					.attributes("aria-checked"),
			).toBe("true");
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
			expect(wrapper.get('nav [role="switch"]').text()).toContain(
				"Modo escuro",
			);
		});
	});
});
