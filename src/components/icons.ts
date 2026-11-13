import type { Track } from "../lib/tracks";

// Simple 24px stroke icons drawn for Stackr, so we do not pull in an icon
// library for a dozen shapes.
export const ICON_PATHS = {
	arrowRight: ["M5 12h14", "M13 6l6 6-6 6"],
	book: [
		"M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z",
		"M4 20a2 2 0 0 0 2 2h13",
		"M9 7h6",
	],
	quiz: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M8.5 12.5l2.5 2.5 4.5-5"],
	trophy: [
		"M8 21h8",
		"M12 17v4",
		"M7 4h10v5a5 5 0 0 1-10 0z",
		"M17 6h3v1a4 4 0 0 1-4 4",
		"M7 6H4v1a4 4 0 0 0 4 4",
	],
	flame: [
		"M12 3c1.5 3 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 0 2 1 3.5 2.5 3.5 0-3.5-1-5.5 0-8.5z",
	],
	stacks: [
		"M4 7c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3z",
		"M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7",
		"M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5",
	],
	sparkle: ["M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"],
	sprout: [
		"M12 21v-9",
		"M12 12c0-4.5 3-7 8-7 0 5-3 7-8 7z",
		"M12 14.5c0-3.5-2.5-6-7-6 0 4 2.5 6 7 6z",
	],
	trendingUp: ["M3 17l6-6 4 4 8-8", "M15 7h6v6"],
	shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M9 12l2 2 4-4"],
	target: [
		"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
		"M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
		"M12 12h.01",
	],
	clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"],
	sun: [
		"M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
		"M12 2v2",
		"M12 20v2",
		"M4.9 4.9l1.4 1.4",
		"M17.7 17.7l1.4 1.4",
		"M2 12h2",
		"M20 12h2",
		"M4.9 19.1l1.4-1.4",
		"M17.7 6.3l1.4-1.4",
	],
	moon: ["M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"],
	dashboard: [
		"M4 4h7v7H4z",
		"M13 4h7v4h-7z",
		"M13 10h7v10h-7z",
		"M4 13h7v7H4z",
	],
	sliders: [
		"M4 6h9",
		"M19 6h1",
		"M16 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
		"M4 12h3",
		"M13 12h7",
		"M10 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
		"M4 18h11",
		"M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
	],
	globe: [
		"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
		"M3 12h18",
		"M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
	],
	logout: [
		"M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3",
		"M10 16l-4-4 4-4",
		"M6 12h10",
	],
	home: ["M4 11l8-7 8 7", "M6 9.5V20h12V9.5"],
	mail: ["M4 6h16v12H4z", "M4 7l8 6 8-6"],
	user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21c0-4 3.6-6 8-6s8 2 8 6"],
} as const;

export type IconName = keyof typeof ICON_PATHS;

export const TRACK_ICONS: Record<Track, IconName> = {
	foundation: "sprout",
	strategist: "trendingUp",
	arena: "shield",
};
