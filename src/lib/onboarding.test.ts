import { describe, expect, it } from "vitest";
import {
	ONBOARDING_QUESTIONS,
	type OnboardingAnswers,
	scoreAnswers,
	trackForScore,
} from "./onboarding";

function answersByPosition(positions: number[]): OnboardingAnswers {
	return Object.fromEntries(
		ONBOARDING_QUESTIONS.map((question, index) => [
			question.id,
			question.options[positions[index]],
		]),
	);
}

describe("ONBOARDING_QUESTIONS", () => {
	it("has three knowledge and three risk questions", () => {
		const kinds = ONBOARDING_QUESTIONS.map((question) => question.kind);

		expect(kinds.filter((kind) => kind === "knowledge")).toHaveLength(3);
		expect(kinds.filter((kind) => kind === "risk")).toHaveLength(3);
	});

	it("lists the right answer among the options of every knowledge question", () => {
		for (const question of ONBOARDING_QUESTIONS) {
			if (question.kind === "knowledge") {
				expect(question.options).toContain(question.correctOption);
			}
		}
	});
});

describe("scoreAnswers", () => {
	it("scores zero when nothing is answered", () => {
		expect(scoreAnswers({})).toEqual({ knowledge: 0, risk: 0 });
	});

	it("counts one point per right knowledge answer", () => {
		const score = scoreAnswers(answersByPosition([0, 2, 1, 0, 0, 0]));

		expect(score).toEqual({ knowledge: 3, risk: 0 });
	});

	it("gives no knowledge points for 'not sure'", () => {
		const score = scoreAnswers(answersByPosition([3, 3, 3, 0, 0, 0]));

		expect(score.knowledge).toBe(0);
	});

	it("adds up to six risk points for the boldest answers", () => {
		const score = scoreAnswers(answersByPosition([3, 3, 3, 2, 2, 2]));

		expect(score.risk).toBe(6);
	});

	it("ignores an option the question does not have", () => {
		expect(scoreAnswers({ marketDrop: "yolo" })).toEqual({
			knowledge: 0,
			risk: 0,
		});
	});
});

describe("trackForScore", () => {
	it("sends a beginner to Foundation", () => {
		expect(trackForScore({ knowledge: 1, risk: 3 })).toBe("foundation");
	});

	it("sends a careful user who knows the basics to Strategist", () => {
		expect(trackForScore({ knowledge: 2, risk: 3 })).toBe("strategist");
	});

	it("sends a bold user to Arena even if they know the theory", () => {
		expect(trackForScore({ knowledge: 3, risk: 4 })).toBe("arena");
	});

	it("sends a bold beginner to Arena", () => {
		expect(trackForScore({ knowledge: 0, risk: 6 })).toBe("arena");
	});
});
