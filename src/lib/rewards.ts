// The id is a translation key under "levels", the name itself lives in i18n.
export const LEVELS = [
	{ level: 1, id: "beginner", minXp: 0 },
	{ level: 2, id: "apprentice", minXp: 200 },
	{ level: 3, id: "saver", minXp: 500 },
	{ level: 4, id: "investor", minXp: 900 },
	{ level: 5, id: "stackrMaster", minXp: 1400 },
] as const;

export type Level = (typeof LEVELS)[number];

export function levelForXp(xp: number): Level {
	return [...LEVELS].reverse().find((entry) => xp >= entry.minXp) ?? LEVELS[0];
}

export interface LevelProgress {
	level: Level;
	nextLevel: Level | null;
	/** XP still needed to reach the next level, zero at the top level. */
	remainingXp: number;
	/** Share of the way from this level to the next, from 0 to 100. */
	percent: number;
}

export function levelProgress(xp: number): LevelProgress {
	const level = levelForXp(xp);
	const nextLevel = LEVELS.find((entry) => entry.level === level.level + 1);
	if (!nextLevel) {
		return { level, nextLevel: null, remainingXp: 0, percent: 100 };
	}
	const span = nextLevel.minXp - level.minXp;
	const gained = Math.max(xp - level.minXp, 0);
	return {
		level,
		nextLevel,
		remainingXp: nextLevel.minXp - Math.max(xp, level.minXp),
		percent: Math.floor((gained / span) * 100),
	};
}

// XP and Stacks only ever move in whole points, so a fraction or a negative
// value is always a bug in the caller and should fail loudly.
export function assertWholeAmount(amount: number, label: string): void {
	if (!Number.isInteger(amount) || amount < 0) {
		throw new Error(`${label} must be a whole number of zero or more.`);
	}
}
