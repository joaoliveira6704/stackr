import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { useAuth } from "../lib/use-auth";
import { useProgressStore } from "../stores/progress";
import { DEMO_PASSWORD, demoUser, fakeApi } from "../test/fake-api";
import { answerConfirmDialog, mountAt } from "../test/mount";
import ProfileView from "./ProfileView.vue";
import ShopView from "./ShopView.vue";

const SUNSET_PRICE = 80;
const CROWN_PRICE = 120;

afterEach(() => {
	useAuth().signOut();
	localStorage.clear();
	document.documentElement.removeAttribute("data-colour-theme");
});

async function mountShop(stacks: number, locale: "en" | "pt-PT" = "en") {
	fakeApi();
	await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
	const { wrapper } = await mountAt("/shop", ShopView, locale);
	useProgressStore().addStacks(stacks);
	await flushPromises();
	return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountShop>>;

function card(wrapper: Wrapper, item: string) {
	return wrapper.get(`[data-item="${item}"]`);
}

function buttonIn(wrapper: Wrapper, item: string, label: string) {
	const button = card(wrapper, item)
		.findAll("button")
		.find((candidate) => candidate.text().includes(label));
	if (!button) throw new Error(`No "${label}" button on ${item}`);
	return button;
}

async function startBuying(wrapper: Wrapper, item: string) {
	await buttonIn(wrapper, item, "Buy for").trigger("click");
	await flushPromises();
}

describe("ShopView", () => {
	it("lists the colour themes and profile icons with their prices", async () => {
		const wrapper = await mountShop(0);

		expect(wrapper.text()).toContain("Colour themes");
		expect(wrapper.text()).toContain("Profile icons");
		expect(card(wrapper, "theme:sunset").text()).toContain(
			`Buy for ${SUNSET_PRICE} Stacks`,
		);
		expect(card(wrapper, "avatar:crown").text()).toContain(
			`Buy for ${CROWN_PRICE} Stacks`,
		);
	});

	it("tags only the animated themes as animated", async () => {
		const wrapper = await mountShop(0);

		for (const item of ["theme:neon", "theme:ember", "theme:prism"]) {
			expect(card(wrapper, item).get("[data-tag]").text()).toBe("Animated");
		}
		for (const item of ["theme:default", "theme:grape", "theme:sunset"]) {
			expect(card(wrapper, item).find("[data-tag]").exists()).toBe(false);
		}
	});

	it("lists the free default first, then the static and the animated themes", async () => {
		const wrapper = await mountShop(0);

		const themes = wrapper
			.get('[aria-labelledby="themes-title"]')
			.findAll("[data-item]")
			.map((item) => item.attributes("data-item"));
		expect(themes[0]).toBe("theme:default");
		expect(themes.indexOf("theme:aurora")).toBeLessThan(
			themes.indexOf("theme:neon"),
		);
	});

	it("keeps the profile icons apart from the colour themes", async () => {
		const wrapper = await mountShop(0);

		const themes = wrapper.get('[aria-labelledby="themes-title"]');
		expect(themes.find('[data-item^="avatar:"]').exists()).toBe(false);
	});

	it("shows the free default look as in use before anything is bought", async () => {
		const wrapper = await mountShop(0);

		expect(card(wrapper, "theme:default").text()).toContain("In use");
		expect(card(wrapper, "avatar:initials").text()).toContain("In use");
	});

	it("disables buying and says how many Stacks are missing", async () => {
		const wrapper = await mountShop(50);

		expect(
			buttonIn(wrapper, "theme:sunset", "Buy for").attributes("disabled"),
		).toBeDefined();
		expect(card(wrapper, "theme:sunset").text()).toContain(
			`You need ${SUNSET_PRICE - 50} more Stacks.`,
		);
	});

	it("asks before buying and spends nothing until the user confirms", async () => {
		const wrapper = await mountShop(100);

		await startBuying(wrapper, "theme:sunset");

		const dialog = wrapper.get('[role="alertdialog"]');
		expect(dialog.text()).toContain("Buy this theme?");
		expect(dialog.text()).toContain(`spend ${SUNSET_PRICE} Stacks on "Sunset"`);
		expect(useProgressStore().stacks).toBe(100);
		expect(useProgressStore().unlockedContent).toEqual([]);
	});

	it("spends nothing and applies nothing when the user cancels", async () => {
		const wrapper = await mountShop(100);

		await startBuying(wrapper, "theme:sunset");
		await answerConfirmDialog(wrapper, "cancel");

		const progress = useProgressStore();
		expect(progress.stacks).toBe(100);
		expect(progress.unlockedContent).toEqual([]);
		expect(progress.equipped.colourTheme).toBeNull();
		expect(document.documentElement.hasAttribute("data-colour-theme")).toBe(
			false,
		);
	});

	it("spends the Stacks and applies the theme once the user confirms", async () => {
		const wrapper = await mountShop(100);

		await startBuying(wrapper, "theme:sunset");
		await answerConfirmDialog(wrapper, "confirm");

		const progress = useProgressStore();
		expect(progress.stacks).toBe(100 - SUNSET_PRICE);
		expect(progress.equipped.colourTheme).toBe("sunset");
		expect(card(wrapper, "theme:sunset").text()).toContain("In use");
		expect(card(wrapper, "theme:default").text()).not.toContain("In use");
	});

	it("switches back to a bought theme for free", async () => {
		const wrapper = await mountShop(100);
		await startBuying(wrapper, "theme:sunset");
		await answerConfirmDialog(wrapper, "confirm");
		await buttonIn(wrapper, "theme:default", "Apply").trigger("click");

		await buttonIn(wrapper, "theme:sunset", "Apply").trigger("click");

		expect(useProgressStore().stacks).toBe(100 - SUNSET_PRICE);
		expect(useProgressStore().equipped.colourTheme).toBe("sunset");
		expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);
	});

	it("shows the shop in Portuguese", async () => {
		const wrapper = await mountShop(0, "pt-PT");

		expect(wrapper.text()).toContain("Loja");
		expect(wrapper.text()).toContain("Temas de cor");
		expect(card(wrapper, "theme:prism").text()).toContain("Animado");
		expect(wrapper.text()).toContain("Ícones de perfil");
		expect(card(wrapper, "theme:sunset").text()).toContain(
			`Comprar por ${SUNSET_PRICE} Stacks`,
		);
	});
});

describe("ProfileView avatar", () => {
	async function mountProfile() {
		fakeApi();
		await useAuth().signIn(demoUser.email, DEMO_PASSWORD);
		const { wrapper } = await mountAt("/profile", ProfileView);
		await flushPromises();
		return wrapper;
	}

	it("shows the initials when no icon is in use", async () => {
		const wrapper = await mountProfile();

		const avatar = wrapper.get("[data-avatar]");
		expect(avatar.attributes("data-avatar")).toBe("initials");
		expect(avatar.text()).toBe("JO");
	});

	it("shows the icon the user bought and applied", async () => {
		const wrapper = await mountProfile();
		const progress = useProgressStore();
		progress.addStacks(CROWN_PRICE);
		progress.unlockContent("avatar:crown", CROWN_PRICE);
		progress.equip("avatar", "crown");
		await flushPromises();

		expect(wrapper.get("[data-avatar]").attributes("data-avatar")).toBe(
			"crown",
		);
	});

	it("links to the shop to change the icon", async () => {
		const wrapper = await mountProfile();

		expect(wrapper.find('a[href="/shop"]').text()).toContain(
			"Change it in the shop",
		);
	});
});
