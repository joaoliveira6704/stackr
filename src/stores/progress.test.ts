import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { answersFor, quizzes } from "../test/content-fixtures";
import { emptyProgress, useProgressStore } from "./progress";

beforeEach(() => {
	setActivePinia(createPinia());
});

describe("progress store", () => {
	it("starts empty for a new user", () => {
		const progress = useProgressStore();

		expect(progress.track).toBeNull();
		expect(progress.onboardingDone).toBe(false);
		expect(progress.xp).toBe(0);
		expect(progress.stacks).toBe(0);
		expect(progress.level.level).toBe(1);
		expect(progress.completedLessons).toEqual([]);
	});

	it("marks onboarding as done", () => {
		const progress = useProgressStore();

		progress.completeOnboarding();

		expect(progress.onboardingDone).toBe(true);
	});
});

describe("XP", () => {
	it("adds XP to both the total and the weekly count", () => {
		const progress = useProgressStore();

		progress.addXp(30);
		progress.addXp(10);

		expect(progress.xp).toBe(40);
		expect(progress.weeklyXp).toBe(40);
	});

	it("raises the level as soon as XP reaches the next threshold", () => {
		const progress = useProgressStore();

		progress.addXp(200);

		expect(progress.level.id).toBe("apprentice");
	});

	it("clears the weekly count on a new week but keeps the total", () => {
		const progress = useProgressStore();
		progress.addXp(120);

		progress.resetWeek();

		expect(progress.weeklyXp).toBe(0);
		expect(progress.xp).toBe(120);
	});

	it("refuses negative XP and leaves the total unchanged", () => {
		const progress = useProgressStore();
		progress.addXp(50);

		expect(() => progress.addXp(-10)).toThrow("XP must be");
		expect(progress.xp).toBe(50);
	});
});

describe("Stacks", () => {
	it("adds and spends Stacks", () => {
		const progress = useProgressStore();

		progress.addStacks(50);
		progress.spendStacks(30);

		expect(progress.stacks).toBe(20);
	});

	it("allows spending the whole balance down to zero", () => {
		const progress = useProgressStore();
		progress.addStacks(30);

		progress.spendStacks(30);

		expect(progress.stacks).toBe(0);
	});

	it("refuses to spend more than the balance and explains why", () => {
		const progress = useProgressStore();
		progress.addStacks(20);

		expect(() => progress.spendStacks(30)).toThrow(
			"You need 30 Stacks but only have 20.",
		);
		expect(progress.stacks).toBe(20);
	});

	it("refuses negative and fractional amounts", () => {
		const progress = useProgressStore();
		progress.addStacks(10);

		expect(() => progress.addStacks(-5)).toThrow("Stacks must be");
		expect(() => progress.spendStacks(2.5)).toThrow("Stacks must be");
		expect(progress.stacks).toBe(10);
	});

	it("handles very large balances without losing precision", () => {
		const progress = useProgressStore();

		progress.addStacks(1_000_000_000);
		progress.spendStacks(1);

		expect(progress.stacks).toBe(999_999_999);
	});
});

describe("unlockContent", () => {
	it("charges the cost and marks the content as unlocked", () => {
		const progress = useProgressStore();
		progress.addStacks(60);

		progress.unlockContent("bonus-quiz-1", 30);

		expect(progress.stacks).toBe(30);
		expect(progress.unlockedContent).toEqual(["bonus-quiz-1"]);
	});

	it("does not charge twice for content already unlocked", () => {
		const progress = useProgressStore();
		progress.addStacks(60);

		progress.unlockContent("bonus-quiz-1", 30);
		progress.unlockContent("bonus-quiz-1", 30);

		expect(progress.stacks).toBe(30);
		expect(progress.unlockedContent).toEqual(["bonus-quiz-1"]);
	});

	it("leaves the content locked when the balance is too low", () => {
		const progress = useProgressStore();
		progress.addStacks(10);

		expect(() => progress.unlockContent("extra-lesson-1", 50)).toThrow(
			"You need 50 Stacks",
		);
		expect(progress.unlockedContent).toEqual([]);
	});
});

describe("lessons and reviews", () => {
	it("records a completed lesson only once", () => {
		const progress = useProgressStore();

		progress.completeLesson("budget-1");
		progress.completeLesson("budget-1");

		expect(progress.completedLessons).toEqual(["budget-1"]);
	});

	it("counts quiz attempts per lesson", () => {
		const progress = useProgressStore();

		progress.registerAttempt("budget-1");
		progress.registerAttempt("budget-1");
		progress.registerAttempt("budget-2");

		expect(progress.quizAttempts).toEqual({ "budget-1": 2, "budget-2": 1 });
	});

	it("adds a lesson to review once and clears it after", () => {
		const progress = useProgressStore();

		progress.requireReview("budget-1");
		progress.requireReview("budget-1");
		expect(progress.lessonsToReview).toEqual(["budget-1"]);

		progress.clearReview("budget-1");
		expect(progress.lessonsToReview).toEqual([]);
	});
});

describe("badges", () => {
	it("unlocks a badge only once", () => {
		const progress = useProgressStore();

		progress.unlockBadge("unstoppable");
		progress.unlockBadge("unstoppable");

		expect(progress.badges).toEqual(["unstoppable"]);
	});
});

describe("submitQuiz", () => {
	const quiz = quizzes[0];
	const ALL_RIGHT = ["a", "a", "a", "a", "a"];
	const FAILING = ["a", "b", "a", "b", "b"];

	function submit(picks: string[]) {
		return useProgressStore().submitQuiz(
			quiz.lessonId,
			quiz.questions,
			answersFor(quiz, picks),
		);
	}

	it("completes the lesson and pays the first try reward on a pass", () => {
		const outcome = submit(ALL_RIGHT);
		const progress = useProgressStore();

		expect(outcome.score.passed).toBe(true);
		expect(outcome.firstCompletion).toBe(true);
		expect(outcome.reward).toEqual({ xp: 100, stacks: 25 });
		expect(progress.completedLessons).toEqual([quiz.lessonId]);
		expect(progress.xp).toBe(100);
		expect(progress.stacks).toBe(25);
	});

	it("marks the lesson for review with the missed sections on a fail, and pays nothing", () => {
		const outcome = submit(FAILING);
		const progress = useProgressStore();

		expect(outcome.reward).toEqual({ xp: 0, stacks: 0 });
		expect(progress.lessonsToReview).toEqual([quiz.lessonId]);
		expect(progress.sectionsToReview[quiz.lessonId]).toEqual([
			"first",
			"second",
		]);
		expect(progress.completedLessons).toEqual([]);
		expect(progress.xp).toBe(0);
	});

	it("pays the review bonus and clears the review once the user passes", () => {
		submit(FAILING);
		const outcome = submit(ALL_RIGHT);
		const progress = useProgressStore();

		expect(outcome.reward).toEqual({ xp: 50 + 30 + 15, stacks: 15 });
		expect(progress.lessonsToReview).toEqual([]);
		expect(progress.sectionsToReview[quiz.lessonId]).toBeUndefined();
	});

	it("pays nothing for passing a finished lesson again", () => {
		submit(ALL_RIGHT);
		const again = submit(ALL_RIGHT);

		expect(again.firstCompletion).toBe(false);
		expect(again.reward).toEqual({ xp: 0, stacks: 0 });
		expect(useProgressStore().xp).toBe(100);
	});

	it("never takes a finished lesson away when a retake fails", () => {
		submit(ALL_RIGHT);
		submit(FAILING);
		const progress = useProgressStore();

		expect(progress.completedLessons).toEqual([quiz.lessonId]);
		expect(progress.lessonsToReview).toEqual([]);
	});

	it("counts every attempt and keeps the best score", () => {
		submit(FAILING);
		submit(ALL_RIGHT);
		submit(FAILING);
		const progress = useProgressStore();

		expect(progress.quizAttempts[quiz.lessonId]).toBe(3);
		expect(progress.quizResults[quiz.lessonId]).toBe(100);
	});
});

describe("snapshot, load and reset", () => {
	it("restores exactly what was saved", () => {
		const progress = useProgressStore();
		progress.addXp(120);
		progress.addStacks(30);
		progress.completeLesson("budget-1");
		const saved = progress.snapshot();

		setActivePinia(createPinia());
		const restored = useProgressStore();
		restored.load(saved);

		expect(restored.snapshot()).toEqual(saved);
		expect(restored.level.id).toBe("beginner");
	});

	it("fills in fields missing from older saved progress", () => {
		const progress = useProgressStore();

		progress.load({ xp: 250 } as never);

		expect(progress.xp).toBe(250);
		expect(progress.completedLessons).toEqual([]);
		expect(progress.sectionsToReview).toEqual({});
	});

	it("clears everything on reset, for the next person to sign in", () => {
		const progress = useProgressStore();
		progress.setTrack("arena");
		progress.addXp(500);

		progress.reset();

		expect(progress.snapshot()).toEqual(emptyProgress());
		expect(progress.track).toBeNull();
	});
});

describe("reading the lesson before the quiz", () => {
	const quiz = quizzes[0];

	it("keeps the quiz closed until the lesson is read", () => {
		const progress = useProgressStore();

		expect(progress.canTakeQuiz(quiz.lessonId)).toBe(false);
		progress.markLessonRead(quiz.lessonId);
		expect(progress.canTakeQuiz(quiz.lessonId)).toBe(true);
	});

	it("closes the quiz again after a fail, so the lesson is read once more", () => {
		const progress = useProgressStore();
		progress.markLessonRead(quiz.lessonId);

		progress.submitQuiz(quiz.lessonId, quiz.questions, answersFor(quiz, ["b"]));

		expect(progress.canTakeQuiz(quiz.lessonId)).toBe(false);
	});

	it("keeps the quiz open after a pass", () => {
		const progress = useProgressStore();
		progress.markLessonRead(quiz.lessonId);

		progress.submitQuiz(
			quiz.lessonId,
			quiz.questions,
			answersFor(quiz, ["a", "a", "a", "a", "a"]),
		);

		expect(progress.canTakeQuiz(quiz.lessonId)).toBe(true);
	});

	it("remembers read lessons in the saved progress", () => {
		const progress = useProgressStore();
		progress.markLessonRead(quiz.lessonId);

		expect(progress.snapshot().lessonsRead).toEqual([quiz.lessonId]);
	});
});
