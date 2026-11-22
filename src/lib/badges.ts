// Each badge stands for a lesson. A screen lists the badges of the lessons
// behind it, so the user sees which ideas they are putting into practice
// there. The id is also the translation key under "badges".
export const LESSON_BADGES = [
	{ id: "budgetOnTrack", screens: ["budget"] },
	{ id: "budgetRule", screens: ["budget"] },
	{ id: "solidFund", screens: ["budget"] },
	{ id: "compoundInterest", screens: ["simulator", "register"] },
	{ id: "inflation", screens: ["simulator"] },
	{ id: "diversification", screens: ["simulator", "register"] },
	{ id: "prudentInvestor", screens: ["simulator"] },
] as const;

export type BadgeId = (typeof LESSON_BADGES)[number]["id"];
export type BadgeScreen = (typeof LESSON_BADGES)[number]["screens"][number];

export interface BadgeStatus {
	id: BadgeId;
	earned: boolean;
}

/** The badges behind a screen, in catalogue order, marked when earned. */
export function badgesForScreen(
	screen: BadgeScreen,
	earnedIds: readonly string[],
): BadgeStatus[] {
	return LESSON_BADGES.filter((badge) =>
		(badge.screens as readonly BadgeScreen[]).includes(screen),
	).map((badge) => ({ id: badge.id, earned: earnedIds.includes(badge.id) }));
}
