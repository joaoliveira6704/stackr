import { flushPromises } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { useAuth } from "../lib/use-auth";
import { useProgressStore } from "../stores/progress";
import { DEMO_PASSWORD, demoUser, fakeApi } from "../test/fake-api";
import { answerConfirmDialog, mountAt } from "../test/mount";
import ProfileView from "./ProfileView.vue";
import ShopView from "./ShopView.vue";

const SUNSET_PRICE = 80;
const PRISM_ICON_PRICE = 150;

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

function buyButton(wrapper: Wrapper, item: string) {
	return card(wrapper, item).get("button.btn-primary");
}

function eyeButton(wrapper: Wrapper, item: string) {
	return card(wrapper, item).get("[data-preview-button]");
}

async function openPreview(wrapper: Wrapper, item: string) {
	await eyeButton(wrapper, item).trigger("click");
	await flushPromises();
	return wrapper.get('[role="dialog"]');
}

async function startBuying(wrapper: Wrapper, item: string) {
	await buyButton(wrapper, item).trigger("click");
	await flushPromises();
}

describe("ShopView", () => {
	it("lists the colour themes and profile icons with their prices", async () => {
		const wrapper = await mountShop(0);

		expect(wrapper.text()).toContain("Colour themes");
		expect(wrapper.text()).toContain("Profile icons");
		expect(buyButton(wrapper, "theme:sunset").text()).toContain(
			`Buy · ${SUNSET_PRICE}`,
		);
		expect(buyButton(wrapper, "theme:sunset").attributes("aria-label")).toBe(
			`Buy for ${SUNSET_PRICE} Stacks`,
		);
		expect(buyButton(wrapper, "avatar:prism").attributes("aria-label")).toBe(
			`Buy for ${PRISM_ICON_PRICE} Stacks`,
		);
	});

	it("keeps the theme previews closed until an eye button is pressed", async () => {
		const wrapper = await mountShop(0);

		expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
		expect(eyeButton(wrapper, "theme:sunset").attributes("aria-label")).toBe(
			"Preview Sunset",
		);
		expect(eyeButton(wrapper, "theme:sunset").attributes("aria-haspopup")).toBe(
			"dialog",
		);
	});

	it("opens a small dialog with a window sample of the theme", async () => {
		const wrapper = await mountShop(0);

		const dialog = await openPreview(wrapper, "theme:sunset");

		expect(dialog.text()).toContain("Sunset");
		expect(dialog.text()).toContain("Warm orange and yellow.");
		const sample = dialog.get("[data-theme-preview]");
		expect(sample.attributes("data-large")).toBe("true");
		expect(sample.find(".bg-tangerine").exists()).toBe(true);
		expect(sample.attributes("data-animated")).toBeUndefined();
	});

	it("shows an animated theme moving and tagged as animated in the dialog", async () => {
		const wrapper = await mountShop(0);

		const dialog = await openPreview(wrapper, "theme:prism");

		expect(dialog.get("[data-theme-preview]").attributes("data-animated")).toBe(
			"true",
		);
		expect(dialog.text()).toContain("Animated");
	});

	it("closes the dialog from its close button", async () => {
		const wrapper = await mountShop(0);
		const dialog = await openPreview(wrapper, "theme:sunset");

		const close = dialog
			.findAll("button")
			.find((button) => button.text() === "Close");
		await close?.trigger("click");

		expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
	});

	it("closes the dialog with Escape", async () => {
		const wrapper = await mountShop(0);
		const dialog = await openPreview(wrapper, "theme:sunset");

		await dialog.trigger("keydown", { key: "Escape" });

		expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
	});

	it("offers to buy the theme from the preview dialog", async () => {
		const wrapper = await mountShop(100);

		const dialog = await openPreview(wrapper, "theme:sunset");

		const buy = dialog.get("button.btn-primary");
		expect(buy.text()).toContain(`Buy · ${SUNSET_PRICE}`);
		expect(buy.attributes("disabled")).toBeUndefined();
	});

	it("closes the preview and asks before buying from it", async () => {
		const wrapper = await mountShop(100);
		const dialog = await openPreview(wrapper, "theme:sunset");

		await dialog.get("button.btn-primary").trigger("click");
		await flushPromises();

		expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
		expect(wrapper.get('[role="alertdialog"]').text()).toContain(
			"Buy this theme?",
		);
		expect(useProgressStore().stacks).toBe(100);
	});

	it("buys and applies the theme once the user confirms from the preview", async () => {
		const wrapper = await mountShop(100);
		const dialog = await openPreview(wrapper, "theme:sunset");

		await dialog.get("button.btn-primary").trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "confirm");

		expect(useProgressStore().stacks).toBe(100 - SUNSET_PRICE);
		expect(useProgressStore().equipped.colourTheme).toBe("sunset");
	});

	it("spends nothing when the user cancels a purchase started from the preview", async () => {
		const wrapper = await mountShop(100);
		const dialog = await openPreview(wrapper, "theme:sunset");

		await dialog.get("button.btn-primary").trigger("click");
		await flushPromises();
		await answerConfirmDialog(wrapper, "cancel");

		expect(useProgressStore().stacks).toBe(100);
		expect(useProgressStore().equipped.colourTheme).toBeNull();
	});

	it("disables buying from the preview when Stacks are short", async () => {
		const wrapper = await mountShop(10);

		const dialog = await openPreview(wrapper, "theme:sunset");

		expect(
			dialog.get("button.btn-primary").attributes("disabled"),
		).toBeDefined();
		expect(dialog.text()).toContain(
			`You need ${SUNSET_PRICE - 10} more Stacks.`,
		);
	});

	it("applies a theme the user already owns from the preview, for free", async () => {
		const wrapper = await mountShop(SUNSET_PRICE);
		const progress = useProgressStore();
		progress.unlockContent("theme:sunset", SUNSET_PRICE);
		await flushPromises();
		const dialog = await openPreview(wrapper, "theme:sunset");

		const apply = dialog.get("button.btn-primary");
		expect(apply.text()).toBe("Apply");
		await apply.trigger("click");

		expect(progress.equipped.colourTheme).toBe("sunset");
		expect(progress.stacks).toBe(0);
		expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
	});

	it("says the theme is in use instead of offering to buy it", async () => {
		const wrapper = await mountShop(0);

		const dialog = await openPreview(wrapper, "theme:default");

		expect(dialog.text()).toContain("In use");
		expect(dialog.find("button.btn-primary").exists()).toBe(false);
	});

	it("previews a theme without spending or applying anything", async () => {
		const wrapper = await mountShop(100);

		await openPreview(wrapper, "theme:sunset");

		expect(useProgressStore().stacks).toBe(100);
		expect(useProgressStore().equipped.colourTheme).toBeNull();
		expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);
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

	it("opens with the title and the balance, without a subtitle", async () => {
		const wrapper = await mountShop(0);

		expect(wrapper.get("h1").text()).toBe("Shop");
		expect(wrapper.text()).not.toContain("Make the app your own");
	});

	it("shows the free default look as in use before anything is bought", async () => {
		const wrapper = await mountShop(0);

		expect(card(wrapper, "theme:default").text()).toContain("In use");
		expect(card(wrapper, "avatar:default").text()).toContain("In use");
	});

	it("disables buying and says how many Stacks are missing", async () => {
		const wrapper = await mountShop(50);

		expect(
			buyButton(wrapper, "theme:sunset").attributes("disabled"),
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

	it("tags only the animated profile styles as animated", async () => {
		const wrapper = await mountShop(0);

		for (const item of ["avatar:wave", "avatar:prism"]) {
			expect(card(wrapper, item).get("[data-tag]").text()).toBe("Animated");
		}
		for (const item of ["avatar:default", "avatar:grape", "avatar:duo"]) {
			expect(card(wrapper, item).find("[data-tag]").exists()).toBe(false);
		}
	});

	it("moves the squares only in the animated profile styles", async () => {
		const wrapper = await mountShop(0);
		const movingCells = (item: string) =>
			card(wrapper, item)
				.findAll("[data-cell]")
				.filter((cell) =>
					cell.classes().some((name) => name.includes("animate-identicon")),
				).length;

		expect(movingCells("avatar:wave")).toBeGreaterThan(0);
		expect(movingCells("avatar:prism")).toBeGreaterThan(0);
		expect(movingCells("avatar:duo")).toBe(0);
		expect(movingCells("avatar:default")).toBe(0);
	});

	it("shows the shop in Portuguese", async () => {
		const wrapper = await mountShop(0, "pt-PT");

		expect(wrapper.text()).toContain("Loja");
		expect(wrapper.text()).toContain("Temas de cor");
		expect(card(wrapper, "theme:prism").text()).toContain("Animado");
		expect(wrapper.text()).toContain("Ícones de perfil");
		expect(card(wrapper, "avatar:default").text()).toContain("Clássico");
		expect(buyButton(wrapper, "theme:sunset").text()).toContain(
			`Comprar · ${SUNSET_PRICE}`,
		);
		expect(eyeButton(wrapper, "theme:sunset").attributes("aria-label")).toBe(
			"Pré-visualizar Pôr do sol",
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

	it("shows the free green pattern when no style is in use", async () => {
		const wrapper = await mountProfile();

		const avatar = wrapper.get("[data-avatar]");
		expect(avatar.attributes("data-avatar")).toBe("default");
		expect(avatar.findAll("[data-cell]").length).toBeGreaterThan(0);
		for (const cell of avatar.findAll("[data-cell]")) {
			expect(cell.classes()).toContain("bg-brand");
		}
	});

	it("shows the icon the user bought and applied", async () => {
		const wrapper = await mountProfile();
		const progress = useProgressStore();
		progress.addStacks(PRISM_ICON_PRICE);
		progress.unlockContent("avatar:prism", PRISM_ICON_PRICE);
		progress.equip("avatar", "prism");
		await flushPromises();

		expect(wrapper.get("[data-avatar]").attributes("data-avatar")).toBe(
			"prism",
		);
	});

	it("draws the same pattern on the profile as in the shop", async () => {
		const profile = await mountProfile();
		const profileCells = profile
			.findAll("[data-avatar] > span > span")
			.map((cell) => cell.attributes("data-cell") ?? "");
		useAuth().signOut();

		const shop = await mountShop(0);
		const shopCells = card(shop, "avatar:default")
			.findAll("[data-avatar] > span > span")
			.map((cell) => cell.attributes("data-cell") ?? "");

		expect(profileCells).toHaveLength(25);
		expect(shopCells).toEqual(profileCells);
	});

	it("links to the shop to change the icon", async () => {
		const wrapper = await mountProfile();

		expect(wrapper.find('a[href="/shop"]').text()).toContain(
			"Change it in the shop",
		);
	});
});
