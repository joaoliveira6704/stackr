import { afterEach, describe, expect, it, vi } from "vitest";
import {
	extraLesson,
	extraOneOff,
	fixtureContent,
	lessonOne,
} from "../test/content-fixtures";
import { fakeApi, unreachableApi } from "../test/fake-api";
import {
	fetchLesson,
	fetchLessons,
	fetchOneOffLessons,
	fetchQuiz,
	fetchTrack,
} from "./content-api";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("content API", () => {
	it("loads a track with its modules", async () => {
		fakeApi(fixtureContent);

		const track = await fetchTrack("foundation");

		expect(track.modules.map((module) => module.id)).toEqual([
			"budget",
			"fund",
		]);
	});

	it("loads only the lessons of the given track", async () => {
		fakeApi(fixtureContent);

		const foundation = await fetchLessons("foundation");
		const arena = await fetchLessons("arena");

		expect(foundation).toHaveLength(3);
		expect(foundation.every((lesson) => lesson.trackId === "foundation")).toBe(
			true,
		);
		expect(arena.map((lesson) => lesson.id)).toEqual(["risk-1"]);
		expect(await fetchLessons("strategist")).toHaveLength(0);
	});

	it("loads the one-off catalogue together with each lesson", async () => {
		fakeApi(fixtureContent);

		expect(await fetchOneOffLessons()).toEqual([
			{ oneOff: extraOneOff, lesson: extraLesson },
		]);
	});

	it("loads an empty one-off catalogue", async () => {
		fakeApi({ ...fixtureContent, oneOffs: [] });

		expect(await fetchOneOffLessons()).toEqual([]);
	});

	it("loads a lesson and its quiz", async () => {
		fakeApi(fixtureContent);

		expect((await fetchLesson(lessonOne.id)).sections).toHaveLength(2);
		expect((await fetchQuiz(lessonOne.id)).questions).toHaveLength(5);
	});

	it("says the content was not found for an unknown lesson or quiz", async () => {
		fakeApi(fixtureContent);

		await expect(fetchLesson("nope")).rejects.toThrow("contentNotFound");
		await expect(fetchQuiz("nope")).rejects.toThrow("contentNotFound");
		await expect(fetchTrack("arena")).rejects.toThrow("contentNotFound");
	});

	it("explains when the API cannot be reached", async () => {
		unreachableApi();

		await expect(fetchTrack("foundation")).rejects.toThrow("apiUnreachable");
	});
});
