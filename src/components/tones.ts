import type { Track } from "../lib/tracks";

// Full class names are written out so Tailwind can find them in the source.
export const TONE_CLASSES = {
	brand: "bg-brand/15 text-brand-strong",
	grape: "bg-grape/15 text-grape-strong",
	tangerine: "bg-tangerine/15 text-tangerine-strong",
	sun: "bg-sun/20 text-sun-strong",
} as const;

export type Tone = keyof typeof TONE_CLASSES;

export const TRACK_TONES: Record<Track, Tone> = {
	foundation: "brand",
	strategist: "grape",
	arena: "tangerine",
};
