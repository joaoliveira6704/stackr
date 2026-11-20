import type { BadgeId } from "../lib/badges";
import type { BudgetGroup, SpendingLevel } from "../lib/budget";
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

export const BUDGET_GROUP_TONES: Record<BudgetGroup, Tone> = {
	needs: "grape",
	wants: "tangerine",
	savings: "brand",
};

export const BADGE_TONES: Record<BadgeId, Tone> = {
	budgetOnTrack: "brand",
	budgetRule: "grape",
	solidFund: "sun",
	compoundInterest: "grape",
	inflation: "tangerine",
	diversification: "brand",
	prudentInvestor: "sun",
};

// The bar and the line under it share a colour, so the two always agree on
// how close the spending is to the plan.
export const SPENDING_LEVEL_CLASSES: Record<
	SpendingLevel,
	{ bar: string; text: string }
> = {
	calm: { bar: "bg-brand", text: "text-brand-strong" },
	close: { bar: "bg-tangerine", text: "text-tangerine-strong" },
	limit: { bar: "bg-cherry", text: "text-cherry-strong" },
};
