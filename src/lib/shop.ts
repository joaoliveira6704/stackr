// The Stacks shop only sells cosmetics. Each item is bought once with
// unlockContent and then applied or taken off for free, so this file is the
// one place that holds what is on sale and what it costs.

export const PALETTE_COLOURS = ["brand", "grape", "tangerine", "sun"] as const;
export type PaletteColour = (typeof PALETTE_COLOURS)[number];

export type CosmeticKind = "avatar" | "colourTheme";

export const COLOUR_THEME_IDS = [
	"grape",
	"sunset",
	"citrus",
	"aurora",
	"neon",
	"ember",
	"prism",
] as const;
export type ColourThemeId = (typeof COLOUR_THEME_IDS)[number];

export const AVATAR_IDS = [
	"grape",
	"tangerine",
	"sun",
	"duo",
	"ember",
	"wave",
	"prism",
] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

// Everything in the shop comes in three levels. Level 1 is the free default,
// level 2 items change colours and level 3 items also move.
export type ShopLevel = 2 | 3;

export interface ColourTheme {
	id: ColourThemeId;
	price: number;
	level: ShopLevel;
	/** The colours of the four backdrop orbs, matching themes.css. */
	orbs: readonly PaletteColour[];
}

/** How a level 3 profile picture moves. */
export type AvatarMotion = "wave" | "cycle";

/** A style for the identicon drawn from the user's id, see identicon.ts. */
export interface Avatar {
	id: AvatarId;
	price: number;
	level: ShopLevel;
	/** The colours its squares are painted with, mixed when there are two. */
	colours: readonly PaletteColour[];
	motion?: AvatarMotion;
}

/** The free look everyone starts with, the same orbs as without a theme. */
export const DEFAULT_ORBS: readonly PaletteColour[] = [
	"brand",
	"grape",
	"brand",
	"tangerine",
];

export const COLOUR_THEMES: readonly ColourTheme[] = [
	{
		id: "grape",
		price: 60,
		level: 2,
		orbs: ["grape", "grape", "brand", "grape"],
	},
	{
		id: "sunset",
		price: 80,
		level: 2,
		orbs: ["tangerine", "sun", "tangerine", "grape"],
	},
	{
		id: "citrus",
		price: 80,
		level: 2,
		orbs: ["sun", "brand", "sun", "tangerine"],
	},
	{
		id: "aurora",
		price: 100,
		level: 2,
		orbs: ["grape", "brand", "tangerine", "sun"],
	},
	{
		id: "neon",
		price: 150,
		level: 3,
		orbs: ["brand", "grape", "brand", "grape"],
	},
	{
		id: "ember",
		price: 150,
		level: 3,
		orbs: ["tangerine", "sun", "tangerine", "sun"],
	},
	{
		id: "prism",
		price: 200,
		level: 3,
		orbs: ["brand", "grape", "tangerine", "sun"],
	},
];

/** True when the theme in use makes the backdrop move. */
export function isAnimatedTheme(id: ColourThemeId | null): boolean {
	return COLOUR_THEMES.some((theme) => theme.id === id && theme.level === 3);
}

/** The free style everyone starts with, their pattern in brand green. */
export const DEFAULT_AVATAR_COLOURS: readonly PaletteColour[] = ["brand"];

export const AVATARS: readonly Avatar[] = [
	{ id: "grape", price: 30, level: 2, colours: ["grape"] },
	{ id: "tangerine", price: 30, level: 2, colours: ["tangerine"] },
	{ id: "sun", price: 30, level: 2, colours: ["sun"] },
	{ id: "duo", price: 50, level: 2, colours: ["brand", "grape"] },
	{ id: "ember", price: 50, level: 2, colours: ["tangerine", "sun"] },
	{ id: "wave", price: 100, level: 3, colours: ["brand"], motion: "wave" },
	{
		id: "prism",
		price: 150,
		level: 3,
		colours: ["brand", "grape", "tangerine", "sun"],
		motion: "cycle",
	},
];

export function findAvatar(id: AvatarId | null): Avatar | undefined {
	return AVATARS.find((avatar) => avatar.id === id);
}

const ID_PREFIXES: Record<CosmeticKind, string> = {
	avatar: "avatar",
	colourTheme: "theme",
};

// Bought items share the unlockedContent list with modules and one-off
// lessons, so the prefix keeps them from ever colliding with a content id.
export function shopItemId(kind: CosmeticKind, id: string): string {
	return `${ID_PREFIXES[kind]}:${id}`;
}
