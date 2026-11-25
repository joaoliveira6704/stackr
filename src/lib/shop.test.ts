import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	AVATARS,
	COLOUR_THEMES,
	DEFAULT_ORBS,
	isAnimatedTheme,
	PALETTE_COLOURS,
	shopItemId,
} from "./shop";

const themesCss = readFileSync("src/styles/themes.css", "utf-8");

/** The colour token behind each of the four orbs in a themes.css block. */
function orbTokensIn(selector: string): string[] {
	const start = themesCss.indexOf(selector);
	if (start === -1) throw new Error(`No CSS block for ${selector}`);
	const block = themesCss.slice(start, themesCss.indexOf("}", start));
	return [1, 2, 3, 4].map((orb) => {
		const match = block.match(
			new RegExp(`--orb-${orb}: var\\(--color-([a-z0-9-]+)\\)`),
		);
		if (!match) throw new Error(`${selector} has no colour for orb ${orb}`);
		return match[1];
	});
}

const allItems = [...COLOUR_THEMES, ...AVATARS];

describe("shop catalogue", () => {
	it("prices every item in whole Stacks above zero", () => {
		for (const item of allItems) {
			expect(Number.isInteger(item.price), item.id).toBe(true);
			expect(item.price, item.id).toBeGreaterThan(0);
		}
	});

	it("never lists the same colour theme or avatar twice", () => {
		const themeIds = COLOUR_THEMES.map((theme) => theme.id);
		const avatarIds = AVATARS.map((avatar) => avatar.id);

		expect(new Set(themeIds).size).toBe(themeIds.length);
		expect(new Set(avatarIds).size).toBe(avatarIds.length);
	});

	it("gives a theme and an avatar with the same name different ids", () => {
		expect(shopItemId("colourTheme", "grape")).toBe("theme:grape");
		expect(shopItemId("avatar", "grape")).toBe("avatar:grape");
	});
});

describe("colour themes in themes.css", () => {
	it("matches the default orbs to the look without a theme", () => {
		expect(orbTokensIn(":root")).toEqual(DEFAULT_ORBS);
	});

	it.each(
		COLOUR_THEMES,
	)("paints the $id theme with the colours the shop shows", (theme) => {
		expect(orbTokensIn(`[data-colour-theme="${theme.id}"]`)).toEqual(
			theme.orbs,
		);
	});

	it.each(
		COLOUR_THEMES,
	)("keeps the $id theme inside the brand palette", (theme) => {
		for (const colour of theme.orbs) {
			expect(PALETTE_COLOURS).toContain(colour);
		}
	});
});

describe("theme levels", () => {
	it("animates only the level 3 themes", () => {
		for (const theme of COLOUR_THEMES) {
			expect(isAnimatedTheme(theme.id), theme.id).toBe(theme.level === 3);
		}
	});

	it("keeps the free default still", () => {
		expect(isAnimatedTheme(null)).toBe(false);
	});

	it("sells at least one static and one animated theme", () => {
		const levels = new Set(COLOUR_THEMES.map((theme) => theme.level));

		expect(levels).toEqual(new Set([2, 3]));
	});

	it("prices every animated theme above every static one", () => {
		const prices = (level: number) =>
			COLOUR_THEMES.filter((theme) => theme.level === level).map(
				(theme) => theme.price,
			);

		expect(Math.min(...prices(3))).toBeGreaterThan(Math.max(...prices(2)));
	});
});
