// Axis ticks land on round numbers such as 0, 25 000, 50 000, so the chart
// reads at a glance.
const NICE_STEPS = [1, 2, 2.5, 5, 10];
// Years only ever move in whole steps.
const YEAR_STEPS = [1, 2, 5, 10];

function niceStep(rough: number, steps = NICE_STEPS): number {
	const magnitude = 10 ** Math.floor(Math.log10(rough));
	const step = steps.find((candidate) => candidate * magnitude >= rough);
	return (step ?? 10) * magnitude;
}

/** Round ticks from zero up to at least the largest value. */
export function niceTicks(maxValue: number, targetCount = 4): number[] {
	if (!Number.isFinite(maxValue) || maxValue <= 0) return [0, 1];
	const step = niceStep(maxValue / targetCount);
	const count = Math.ceil(maxValue / step);
	return Array.from({ length: count + 1 }, (_, index) => index * step);
}

/** Year labels for the x axis: the first, the last and round steps between. */
export function yearTicks(lastYear: number, targetCount = 5): number[] {
	if (lastYear <= 0) return [0];
	const step = Math.max(1, niceStep(lastYear / targetCount, YEAR_STEPS));
	const ticks: number[] = [];
	for (let year = 0; year < lastYear; year += step) ticks.push(year);
	// Drop a tick that would sit right next to the last one.
	if (ticks.length > 1 && lastYear - ticks[ticks.length - 1] < step / 2) {
		ticks.pop();
	}
	return [...ticks, lastYear];
}
