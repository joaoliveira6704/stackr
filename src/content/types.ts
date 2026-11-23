import type { Locale } from "../i18n";
import type { Track } from "../lib/tracks";

/**
 * Lesson content lives in db.json and comes from the API, so every piece of
 * it carries both languages side by side instead of using the i18n files.
 */
export type Localized = Record<Locale, string>;

export interface LessonSection {
	id: string;
	title: Localized;
	body: Localized;
	/** An everyday situation that shows the idea in practice. */
	example?: Localized;
}

/** One lesson as stored in the "lessons" collection. */
export interface Lesson {
	id: string;
	trackId: Track;
	moduleId: string;
	title: Localized;
	summary: Localized;
	minutes: number;
	sections: LessonSection[];
}

export interface QuizOption {
	id: string;
	text: Localized;
}

export interface QuizQuestion {
	id: string;
	/** The section this question tests, highlighted when the user gets it wrong. */
	sectionId: string;
	prompt: Localized;
	options: QuizOption[];
	correctOptionId: string;
	explanation: Localized;
}

/** One quiz as stored in the "quizzes" collection, one per lesson. */
export interface Quiz {
	id: string;
	lessonId: string;
	questions: QuizQuestion[];
}

export interface Module {
	id: string;
	title: Localized;
	summary: Localized;
	/** Lessons in the order they are taken. */
	lessonIds: string[];
}

/** One track as stored in the "tracks" collection. */
export interface TrackContent {
	id: Track;
	modules: Module[];
}
