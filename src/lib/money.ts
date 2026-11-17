// Every amount of money in the app goes through these helpers, so rounding is
// the same everywhere. Formatting lives in the i18n number formats.

/** Rounds to whole cents, half away from zero, so 1.005 becomes 1.01. */
export function roundCents(amount: number): number {
	const cents = Math.round(Math.abs(amount) * 100 + Number.EPSILON * 100);
	return (Math.sign(amount) * cents) / 100 || 0;
}

/** Turns a percentage typed by the user, such as 7.5, into a rate of 0.075. */
export function percentToRate(percent: number): number {
	return percent / 100;
}

/** Rounds a percentage to one decimal place, the precision we show. */
export function roundPercent(percent: number): number {
	return Math.round(percent * 10) / 10;
}
