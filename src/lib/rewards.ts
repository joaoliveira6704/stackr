export const LEVELS = [
	{ level: 1, name: "Beginner", minXp: 0 },
	{ level: 2, name: "Apprentice", minXp: 200 },
	{ level: 3, name: "Saver", minXp: 500 },
	{ level: 4, name: "Investor", minXp: 900 },
	{ level: 5, name: "Stackr Master", minXp: 1400 },
] as const;

export type Level = (typeof LEVELS)[number];

export function levelForXp(xp: number): Level {
	return [...LEVELS].reverse().find((entry) => xp >= entry.minXp) ?? LEVELS[0];
}

// XP and Stacks only ever move in whole points, so a fraction or a negative
// value is always a bug in the caller and should fail loudly.
export function assertWholeAmount(amount: number, label: string): void {
	if (!Number.isInteger(amount) || amount < 0) {
		throw new Error(`${label} must be a whole number of zero or more.`);
	}
}
