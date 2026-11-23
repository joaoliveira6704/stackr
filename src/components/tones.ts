import type { BadgeId } from "../lib/badges";
import type { BudgetGroup, SpendingProgress } from "../lib/budget";
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

/** At this share of the plan the bar has turned from red to orange. */
export const PAID_ORANGE_SHARE = 0.1;
/** Green is kept for a bill that is really close to being paid. */
export const PAID_GREEN_SHARE = 0.95;

export interface PaymentColours {
	bar: string;
	text: string;
}

const PAYMENT_COLOURS = {
	cherry: { bar: "var(--color-cherry)", text: "var(--color-cherry-strong)" },
	tangerine: {
		bar: "var(--color-tangerine)",
		text: "var(--color-tangerine-strong)",
	},
	sun: { bar: "var(--color-sun)", text: "var(--color-sun-strong)" },
	brand: { bar: "var(--color-brand)", text: "var(--color-brand-strong)" },
	muted: { bar: "var(--color-ink-muted)", text: "var(--color-ink-muted)" },
} satisfies Record<string, PaymentColours>;

function blendColours(
	from: PaymentColours,
	to: PaymentColours,
	amount: number,
): PaymentColours {
	const percent = Math.round(amount * 100);
	const blend = (start: string, end: string) =>
		`color-mix(in oklab, ${end} ${percent}%, ${start})`;
	return { bar: blend(from.bar, to.bar), text: blend(from.text, to.text) };
}

// The bar and the line under it share a colour, so the two always agree on
// how close the bill is to being paid.
export function paymentColours({
	share,
	state,
}: Pick<SpendingProgress, "share" | "state">): PaymentColours {
	const { cherry, tangerine, sun, brand, muted } = PAYMENT_COLOURS;
	if (state === "unplanned") return muted;
	if (state === "over") return cherry;
	if (share >= PAID_GREEN_SHARE) return brand;
	if (share < PAID_ORANGE_SHARE) {
		return blendColours(cherry, tangerine, share / PAID_ORANGE_SHARE);
	}
	const towardsYellow =
		(share - PAID_ORANGE_SHARE) / (PAID_GREEN_SHARE - PAID_ORANGE_SHARE);
	return blendColours(tangerine, sun, towardsYellow);
}
