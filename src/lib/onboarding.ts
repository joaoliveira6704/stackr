import type { Track } from "./tracks";

export const ONBOARDING_PATH = "/onboarding";
export const ONBOARDING_XP = 50;

// Four of the six risk points means the user leaned to the bold answers on
// most questions, which is the Arena profile from the GDD.
const ARENA_MIN_RISK = 4;
const STRATEGIST_MIN_KNOWLEDGE = 2;

interface KnowledgeQuestion {
	id: string;
	kind: "knowledge";
	options: string[];
	correctOption: string;
}

interface RiskQuestion {
	id: string;
	kind: "risk";
	// Each option is worth its index in points: 0 is careful, 2 is bold.
	options: string[];
}

export type OnboardingQuestion = KnowledgeQuestion | RiskQuestion;

/** Question id mapped to the chosen option id. */
export type OnboardingAnswers = Record<string, string>;

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
	{
		id: "budgetRule",
		kind: "knowledge",
		options: [
			"needsWantsSavings",
			"taxesRentFood",
			"stocksBondsCash",
			"notSure",
		],
		correctOption: "needsWantsSavings",
	},
	{
		id: "inflation",
		kind: "knowledge",
		options: ["grows", "staysTheSame", "shrinks", "notSure"],
		correctOption: "shrinks",
	},
	{
		id: "etf",
		kind: "knowledge",
		options: ["singleShare", "basketFund", "savingsAccount", "notSure"],
		correctOption: "basketFund",
	},
	{
		id: "marketDrop",
		kind: "risk",
		options: ["sellEverything", "wait", "buyMore"],
	},
	{
		id: "betChoice",
		kind: "risk",
		options: ["sureAmount", "coinFlip", "longShot"],
	},
	{
		id: "hotTip",
		kind: "risk",
		options: ["ignore", "research", "buyNow"],
	},
];

export interface OnboardingScore {
	knowledge: number;
	risk: number;
}

function pointsFor(question: OnboardingQuestion, answer: string): number {
	if (question.kind === "knowledge") {
		return answer === question.correctOption ? 1 : 0;
	}
	return Math.max(question.options.indexOf(answer), 0);
}

export function scoreAnswers(
	answers: OnboardingAnswers,
	questions: OnboardingQuestion[] = ONBOARDING_QUESTIONS,
): OnboardingScore {
	const score: OnboardingScore = { knowledge: 0, risk: 0 };
	for (const question of questions) {
		const answer = answers[question.id];
		if (answer === undefined) continue;
		score[question.kind] += pointsFor(question, answer);
	}
	return score;
}

// Risk wins over knowledge on purpose: someone who knows the theory but
// chases quick wins still needs the Arena lessons on managing risk.
export function trackForScore(score: OnboardingScore): Track {
	if (score.risk >= ARENA_MIN_RISK) return "arena";
	if (score.knowledge >= STRATEGIST_MIN_KNOWLEDGE) return "strategist";
	return "foundation";
}
