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
	"leaf",
	"rocket",
	"zap",
	"cat",
	"gem",
	"crown",
] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

// Themes come in three levels. Level 1 is the free default, level 2 themes
// recolour the backdrop and level 3 themes also make it move.
export type ThemeLevel = 2 | 3;

export interface ColourTheme {
	id: ColourThemeId;
	price: number;
	level: ThemeLevel;
	/** The colours of the four backdrop orbs, matching themes.css. */
	orbs: readonly PaletteColour[];
}

export interface Avatar {
	id: AvatarId;
	price: number;
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

export const AVATARS: readonly Avatar[] = [
	{ id: "leaf", price: 30 },
	{ id: "rocket", price: 40 },
	{ id: "zap", price: 50 },
	{ id: "cat", price: 60 },
	{ id: "gem", price: 80 },
	{ id: "crown", price: 120 },
];

const ID_PREFIXES: Record<CosmeticKind, string> = {
	avatar: "avatar",
	colourTheme: "theme",
};

// Bought items share the unlockedContent list with modules and one-off
// lessons, so the prefix keeps them from ever colliding with a content id.
export function shopItemId(kind: CosmeticKind, id: string): string {
	return `${ID_PREFIXES[kind]}:${id}`;
}
