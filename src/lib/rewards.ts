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

// Amounts from the GDD, section 7.1.
export const LESSON_REWARDS = {
	xpPerCorrectAnswer: 10,
	xpForLesson: 30,
	xpFirstTryBonus: 20,
	xpAfterReview: 15,
	stacksForLesson: 10,
	stacksForPass: 5,
	stacksFirstTryBonus: 10,
} as const;

export interface Reward {
	xp: number;
	stacks: number;
}

export const NO_REWARD: Reward = { xp: 0, stacks: 0 };

export interface PassedLesson {
	correctAnswers: number;
	/** 1 for the first try, 2 for the second and so on. */
	attempt: number;
	/** The user went back to the lesson after failing before passing. */
	afterReview: boolean;
}

// Rewards are only paid the first time a lesson is passed. Failing gives
// nothing and retaking a finished lesson gives nothing, so nobody can farm
// XP by answering the same quiz again and again.
export function rewardForPassedLesson(result: PassedLesson): Reward {
	const firstTry = result.attempt === 1;
	const xp =
		result.correctAnswers * LESSON_REWARDS.xpPerCorrectAnswer +
		LESSON_REWARDS.xpForLesson +
		(firstTry ? LESSON_REWARDS.xpFirstTryBonus : 0) +
		(result.afterReview ? LESSON_REWARDS.xpAfterReview : 0);
	const stacks =
		LESSON_REWARDS.stacksForLesson +
		LESSON_REWARDS.stacksForPass +
		(firstTry ? LESSON_REWARDS.stacksFirstTryBonus : 0);
	return { xp, stacks };
}

// XP and Stacks only ever move in whole points, so a fraction or a negative
// value is always a bug in the caller and should fail loudly.
export function assertWholeAmount(amount: number, label: string): void {
	if (!Number.isInteger(amount) || amount < 0) {
		throw new Error(`${label} must be a whole number of zero or more.`);
	}
}
