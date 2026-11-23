import { describe, expect, it } from "vitest";
import { extraOneOff, foundationTrack } from "../test/content-fixtures";
import {
	canOpenLesson,
	type LearningProgress,
	lessonStatuses,
	moduleStatus,
	nextLessonId,
	oneOffStatus,
} from "./learning";

function progressWith(
	changes: Partial<LearningProgress> = {},
): LearningProgress {
	return {
		completedLessons: [],
		lessonsToReview: [],
		unlockedContent: [],
		...changes,
	};
}

const [budgetModule, fundModule] = foundationTrack.modules;

describe("lessonStatuses", () => {
	it("opens only the first lesson of the free module for a new user", () => {
		expect(lessonStatuses(foundationTrack, progressWith())).toEqual({
			"budget-1": "available",
			"budget-2": "locked",
			"fund-1": "locked",
		});
	});

	it("unlocks the next lesson once the previous one is done", () => {
		const statuses = lessonStatuses(
			foundationTrack,
			progressWith({ completedLessons: ["budget-1"] }),
		);

		expect(statuses["budget-1"]).toBe("done");
		expect(statuses["budget-2"]).toBe("available");
	});

	it("marks a failed lesson for review and keeps the next one locked", () => {
		const statuses = lessonStatuses(
			foundationTrack,
			progressWith({ lessonsToReview: ["budget-1"] }),
		);

		expect(statuses["budget-1"]).toBe("review");
		expect(statuses["budget-2"]).toBe("locked");
	});

	it("keeps a paid module locked even when the free one is finished", () => {
		const statuses = lessonStatuses(
			foundationTrack,
			progressWith({ completedLessons: ["budget-1", "budget-2"] }),
		);

		expect(statuses["fund-1"]).toBe("locked");
	});

	it("opens a bought module straight away, without finishing the one before", () => {
		const statuses = lessonStatuses(
			foundationTrack,
			progressWith({ unlockedContent: ["fund"] }),
		);

		expect(statuses["fund-1"]).toBe("available");
		expect(statuses["budget-2"]).toBe("locked");
	});

	it("treats every track the same, with no free order for Strategist", () => {
		const strategist = { ...foundationTrack, id: "strategist" as const };

		expect(lessonStatuses(strategist, progressWith())["fund-1"]).toBe("locked");
	});
});

describe("moduleStatus", () => {
	it("calls a free module open and a paid one locked for a new user", () => {
		expect(moduleStatus(budgetModule, progressWith())).toBe("open");
		expect(moduleStatus(fundModule, progressWith())).toBe("locked");
	});

	it("opens a paid module once it is bought", () => {
		expect(
			moduleStatus(fundModule, progressWith({ unlockedContent: ["fund"] })),
		).toBe("open");
	});

	it("calls a module done when every lesson in it is done", () => {
		expect(
			moduleStatus(
				budgetModule,
				progressWith({ completedLessons: ["budget-1", "budget-2"] }),
			),
		).toBe("done");
	});
});

describe("oneOffStatus", () => {
	it("keeps a one-off lesson locked until it is bought", () => {
		expect(oneOffStatus(extraOneOff, progressWith())).toBe("locked");
	});

	it("opens a one-off lesson once it is bought", () => {
		expect(
			oneOffStatus(
				extraOneOff,
				progressWith({ unlockedContent: [extraOneOff.id] }),
			),
		).toBe("available");
	});

	it("shows a passed one-off lesson as done", () => {
		expect(
			oneOffStatus(
				extraOneOff,
				progressWith({
					unlockedContent: [extraOneOff.id],
					completedLessons: [extraOneOff.lessonId],
				}),
			),
		).toBe("done");
	});
});

describe("nextLessonId", () => {
	it("suggests the first lesson for a new user", () => {
		expect(nextLessonId(foundationTrack, progressWith())).toBe("budget-1");
	});

	it("suggests a lesson waiting for review before a new one", () => {
		expect(
			nextLessonId(
				foundationTrack,
				progressWith({
					completedLessons: ["budget-1"],
					lessonsToReview: ["budget-2"],
					unlockedContent: ["fund"],
				}),
			),
		).toBe("budget-2");
	});

	it("never suggests a lesson from a module that is not bought", () => {
		expect(
			nextLessonId(
				foundationTrack,
				progressWith({ completedLessons: ["budget-1", "budget-2"] }),
			),
		).toBeNull();
	});

	it("has nothing to suggest once every lesson is done", () => {
		expect(
			nextLessonId(
				foundationTrack,
				progressWith({
					completedLessons: ["budget-1", "budget-2", "fund-1"],
					unlockedContent: ["fund"],
				}),
			),
		).toBeNull();
	});
});

describe("canOpenLesson", () => {
	it("opens every status except locked and unknown", () => {
		expect(canOpenLesson("available")).toBe(true);
		expect(canOpenLesson("review")).toBe(true);
		expect(canOpenLesson("done")).toBe(true);
		expect(canOpenLesson("locked")).toBe(false);
		expect(canOpenLesson(undefined)).toBe(false);
	});
});
