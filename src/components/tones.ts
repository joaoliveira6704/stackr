import type { Track } from "../lib/tracks";

// The tone-* utilities live in src/styles/components.css. Class names are
// written out in full so Tailwind can find them in the source.
export const TONE_CLASSES = {
	brand: "tone-brand",
	grape: "tone-grape",
	tangerine: "tone-tangerine",
	sun: "tone-sun",
	neutral: "tone-neutral",
} as const;

export type Tone = keyof typeof TONE_CLASSES;

export const TRACK_TONES: Record<Track, Tone> = {
	foundation: "brand",
	strategist: "grape",
	arena: "tangerine",
};
