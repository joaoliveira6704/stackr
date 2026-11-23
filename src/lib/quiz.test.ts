import { describe, expect, it } from "vitest";
import { answersFor, quizzes } from "../test/content-fixtures";
import { isCorrect, PASS_MARK, scoreQuiz } from "./quiz";

const quiz = quizzes[0];

describe("scoreQuiz", () => {
	it("gives 100% and a pass when every answer is right", () => {
		const score = scoreQuiz(
			quiz.questions,
			answersFor(quiz, ["a", "a", "a", "a", "a"]),
		);

		expect(score).toMatchObject({
			correct: 5,
			total: 5,
			percent: 100,
			passed: true,
		});
		expect(score.sectionsToReview).toEqual([]);
	});

	it("passes at exactly 80%, four out of five", () => {
		const score = scoreQuiz(
			quiz.questions,
			answersFor(quiz, ["a", "a", "a", "a", "b"]),
		);

		expect(score.percent).toBe(PASS_MARK);
		expect(score.passed).toBe(true);
	});

	it("fails at 60%, three out of five", () => {
		const score = scoreQuiz(
			quiz.questions,
			answersFor(quiz, ["a", "b", "a", "b", "a"]),
		);

		expect(score.percent).toBe(60);
		expect(score.passed).toBe(false);
	});

	it("gives zero and a fail when everything is wrong", () => {
		const score = scoreQuiz(
			quiz.questions,
			answersFor(quiz, ["b", "b", "b", "b", "b"]),
		);

		expect(score).toMatchObject({ correct: 0, percent: 0, passed: false });
	});

	it("counts a question left unanswered as wrong", () => {
		const score = scoreQuiz(quiz.questions, {
			q1: "a",
			q2: "a",
			q3: "a",
			q4: "a",
		});

		expect(score.correct).toBe(4);
		expect(score.sectionsToReview).toEqual(["second"]);
	});

	it("lists each section to review once, even when several questions missed it", () => {
		const score = scoreQuiz(
			quiz.questions,
			answersFor(quiz, ["b", "b", "b", "a", "a"]),
		);

		expect(score.sectionsToReview).toEqual(["first", "second"]);
	});

	it("rounds down, so a quiz just under 80% never passes", () => {
		const questions = [
			...quiz.questions,
			...quiz.questions.slice(0, 1).map((q) => ({ ...q, id: "q6" })),
		];
		const answers = { ...answersFor(quiz, ["a", "a", "a", "a", "b"]), q6: "b" };

		const score = scoreQuiz(questions, answers);

		expect(score.percent).toBe(66);
		expect(score.passed).toBe(false);
	});

	it("never passes an empty quiz", () => {
		expect(scoreQuiz([], {})).toMatchObject({ percent: 0, passed: false });
	});
});

describe("isCorrect", () => {
	it("is true only for the right option", () => {
		expect(isCorrect(quiz.questions[0], "a")).toBe(true);
		expect(isCorrect(quiz.questions[0], "b")).toBe(false);
		expect(isCorrect(quiz.questions[0], undefined)).toBe(false);
	});
});
