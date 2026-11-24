import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES } from "../i18n";
import { TRACKS } from "../lib/tracks";
import type { Lesson, Localized, OneOff, Quiz, TrackContent } from "./types";

// Checks the real lessons and quizzes in db.json, so a typo in the content
// fails here instead of on someone's screen.
const db = JSON.parse(
	readFileSync(resolve(process.cwd(), "db/db.json"), "utf8"),
) as {
	tracks: TrackContent[];
	lessons: Lesson[];
	quizzes: Quiz[];
	oneOffs: OneOff[];
};

function isPrice(value: unknown) {
	return Number.isInteger(value) && (value as number) >= 0;
}

function isFilledIn(value: Localized | undefined) {
	return LOCALES.every((locale) => (value?.[locale] ?? "").trim().length > 0);
}

describe("content in db.json", () => {
	it("has every track", () => {
		expect(db.tracks.map((track) => track.id).sort()).toEqual(
			[...TRACKS].sort(),
		);
	});

	it("points every module at lessons that exist and belong to it", () => {
		for (const track of db.tracks) {
			for (const module of track.modules) {
				for (const lessonId of module.lessonIds) {
					const lesson = db.lessons.find((item) => item.id === lessonId);
					expect(lesson, lessonId).toBeDefined();
					expect(lesson?.trackId).toBe(track.id);
					expect(lesson?.moduleId).toBe(module.id);
				}
			}
		}
	});

	it("keeps the first module of every track free and prices every other one", () => {
		for (const track of db.tracks) {
			expect(track.modules[0]?.price, track.id).toBe(0);
			for (const module of track.modules.slice(1)) {
				expect(isPrice(module.price) && module.price > 0, module.id).toBe(true);
			}
		}
	});

	it("points every one-off at a lesson outside any track, with a price", () => {
		for (const oneOff of db.oneOffs) {
			const lesson = db.lessons.find((item) => item.id === oneOff.lessonId);
			expect(lesson, oneOff.id).toBeDefined();
			expect(lesson?.trackId, oneOff.id).toBeNull();
			expect(lesson?.moduleId, oneOff.id).toBeNull();
			expect(isPrice(oneOff.price), oneOff.id).toBe(true);
		}
	});

	it("places every lesson in exactly one module or one-off", () => {
		const placed = [
			...db.tracks.flatMap((track) =>
				track.modules.flatMap((module) => module.lessonIds),
			),
			...db.oneOffs.map((oneOff) => oneOff.lessonId),
		];
		expect([...placed].sort()).toEqual(
			db.lessons.map((lesson) => lesson.id).sort(),
		);
	});

	it("gives every lesson one quiz of five questions", () => {
		for (const lesson of db.lessons) {
			const quiz = db.quizzes.filter((item) => item.lessonId === lesson.id);
			expect(quiz, lesson.id).toHaveLength(1);
			expect(quiz[0].questions, lesson.id).toHaveLength(5);
		}
	});

	it("ties every question to a section of its lesson and to one of its options", () => {
		for (const quiz of db.quizzes) {
			const lesson = db.lessons.find((item) => item.id === quiz.lessonId);
			const sectionIds = lesson?.sections.map((section) => section.id) ?? [];
			for (const question of quiz.questions) {
				const where = `${quiz.lessonId} ${question.id}`;
				expect(sectionIds, where).toContain(question.sectionId);
				expect(
					question.options.map((option) => option.id),
					where,
				).toContain(question.correctOptionId);
			}
		}
	});

	it("has every text in both Portuguese and English", () => {
		for (const track of db.tracks) {
			for (const module of track.modules) {
				expect(
					isFilledIn(module.title) && isFilledIn(module.summary),
					module.id,
				).toBe(true);
			}
		}
		for (const lesson of db.lessons) {
			const texts = [lesson.title, lesson.summary];
			for (const section of lesson.sections) {
				texts.push(section.title, section.body);
				if (section.example) texts.push(section.example);
			}
			expect(texts.every(isFilledIn), lesson.id).toBe(true);
		}
		for (const quiz of db.quizzes) {
			for (const question of quiz.questions) {
				const texts = [
					question.prompt,
					question.explanation,
					...question.options.map((option) => option.text),
				];
				expect(texts.every(isFilledIn), `${quiz.lessonId} ${question.id}`).toBe(
					true,
				);
			}
		}
	});
});
