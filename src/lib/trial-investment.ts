import { percentToRate, roundCents } from "./money";
import {
	CAPITAL_GAINS_TAX,
	type HoldingPlan,
	type ProjectionSettings,
	projectPortfolio,
} from "./projection";

export type Affordability = "fits" | "tooMuch" | "unknown";

export interface TrialComparison {
	/** The final value of the registered portfolio on its own. */
	withoutTrial: number;
	withTrial: number;
	/** What the new investment adds to the final value. */
	extraValue: number;
	/** The new investment's own gain, after tax. */
	netGain: number;
	/** Its gain after tax and inflation, in today's money. */
	realNetGain: number;
	affordability: Affordability;
	/** What stays free in the budget each month, null without a budget. */
	freeAfterTrial: number | null;
	/** Null when there is no registered portfolio to compare with. */
	beatsPortfolio: boolean | null;
}

function affordabilityOf(
	monthly: number,
	freeMonthly: number | null,
): Pick<TrialComparison, "affordability" | "freeAfterTrial"> {
	if (freeMonthly === null) {
		return { affordability: "unknown", freeAfterTrial: null };
	}
	const freeAfterTrial = roundCents(freeMonthly - monthly);
	return {
		affordability: freeAfterTrial >= 0 ? "fits" : "tooMuch",
		freeAfterTrial,
	};
}

/**
 * Compares the registered portfolio with and without a possible new
 * investment. Throws when an amount or a rate is not valid.
 */
export function compareTrial(
	registered: HoldingPlan[],
	trial: HoldingPlan,
	settings: ProjectionSettings,
	freeMonthly: number | null,
): TrialComparison {
	const base = projectPortfolio(registered, settings);
	const combined = projectPortfolio([...registered, trial], settings);
	const alone = projectPortfolio([trial], settings);
	const inflation =
		(1 + percentToRate(settings.inflationPercent)) ** settings.years;
	const afterTax =
		alone.value - alone.gain * (alone.gain > 0 ? CAPITAL_GAINS_TAX : 0);
	return {
		withoutTrial: base.value,
		withTrial: combined.value,
		extraValue: roundCents(combined.value - base.value),
		netGain: alone.netGain,
		realNetGain: roundCents(afterTax / inflation - alone.investedToday),
		...affordabilityOf(trial.monthly, freeMonthly),
		beatsPortfolio:
			base.invested > 0
				? trial.annualReturnPercent > base.averageReturnPercent
				: null,
	};
}
