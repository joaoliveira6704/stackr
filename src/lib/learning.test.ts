import { describe, expect, it } from "vitest";
import { foundationTrack } from "../test/content-fixtures";
import { canOpenLesson, lessonStatuses, nextLessonId } from "./learning";

const fresh = { completedLessons: [], lessonsToReview: [] };

describe("lessonStatuses", () => {
	it("opens only the first lesson for a new user", () => {
		expect(lessonStatuses(foundationTrack, fresh)).toEqual({
			"budget-1": "available",
			"budget-2": "locked",
			"fund-1": "locked",
		});
	});

	it("unlocks the next lesson once the previous one is done", () => {
		const statuses = lessonStatuses(foundationTrack, {
			completedLessons: ["budget-1"],
			lessonsToReview: [],
		});

		expect(statuses["budget-1"]).toBe("done");
		expect(statuses["budget-2"]).toBe("available");
		expect(statuses["fund-1"]).toBe("locked");
	});

	it("marks a failed lesson for review and keeps the next one locked", () => {
		const statuses = lessonStatuses(foundationTrack, {
			completedLessons: [],
			lessonsToReview: ["budget-1"],
		});

		expect(statuses["budget-1"]).toBe("review");
		expect(statuses["budget-2"]).toBe("locked");
	});

	it("opens the next module only when the whole previous module is done", () => {
		const statuses = lessonStatuses(foundationTrack, {
			completedLessons: ["budget-1", "budget-2"],
			lessonsToReview: [],
		});

		expect(statuses["fund-1"]).toBe("available");
	});

	it("lets Strategist users start any module", () => {
		const strategist = { ...foundationTrack, id: "strategist" as const };

		expect(lessonStatuses(strategist, fresh)["fund-1"]).toBe("available");
		expect(lessonStatuses(strategist, fresh)["budget-2"]).toBe("locked");
	});
});

describe("nextLessonId", () => {
	it("suggests the first lesson for a new user", () => {
		expect(nextLessonId(foundationTrack, fresh)).toBe("budget-1");
	});

	it("suggests a lesson waiting for review before a new one", () => {
		expect(
			nextLessonId(foundationTrack, {
				completedLessons: ["budget-1", "budget-2"],
				lessonsToReview: ["fund-1"],
			}),
		).toBe("fund-1");
	});

	it("has nothing to suggest once every lesson is done", () => {
		expect(
			nextLessonId(foundationTrack, {
				completedLessons: ["budget-1", "budget-2", "fund-1"],
				lessonsToReview: [],
			}),
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
