import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useProgressStore } from "./progress";

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

		expect(progress.level.name).toBe("Apprentice");
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
