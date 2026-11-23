import type {
	Lesson,
	Localized,
	Quiz,
	QuizQuestion,
	TrackContent,
} from "../content/types";

// Small, readable stand ins for the real content in db.json. The English is
// plain and the Portuguese is marked with "(pt)" so tests can tell them apart.
export function both(english: string): Localized {
	return { "pt-PT": `${english} (pt)`, en: english };
}

function question(id: string, sectionId: string): QuizQuestion {
	return {
		id,
		sectionId,
		prompt: both(`Question ${id}`),
		options: [
			{ id: "a", text: both(`Right answer ${id}`) },
			{ id: "b", text: both(`Wrong answer ${id}`) },
			{ id: "c", text: both(`Other wrong answer ${id}`) },
		],
		correctOptionId: "a",
		explanation: both(`Because of ${sectionId}`),
	};
}

function lesson(id: string, moduleId: string): Lesson {
	return {
		id,
		trackId: "foundation",
		moduleId,
		title: both(`Lesson ${id}`),
		summary: both(`Summary ${id}`),
		minutes: 2,
		sections: [
			{ id: "first", title: both("First idea"), body: both("First body") },
			{
				id: "second",
				title: both("Second idea"),
				body: both("Second body"),
				example: both("An everyday example"),
			},
		],
	};
}

export const lessonOne = lesson("budget-1", "budget");
export const lessonTwo = lesson("budget-2", "budget");
export const lessonThree = lesson("fund-1", "fund");

function quizFor(target: Lesson): Quiz {
	return {
		id: `${target.id}-quiz`,
		lessonId: target.id,
		questions: [
			question("q1", "first"),
			question("q2", "first"),
			question("q3", "second"),
			question("q4", "second"),
			question("q5", "second"),
		],
	};
}

export const quizzes = [lessonOne, lessonTwo, lessonThree].map(quizFor);

export const foundationTrack: TrackContent = {
	id: "foundation",
	modules: [
		{
			id: "budget",
			title: both("Budget"),
			summary: both("Budget summary"),
			lessonIds: [lessonOne.id, lessonTwo.id],
		},
		{
			id: "fund",
			title: both("Fund"),
			summary: both("Fund summary"),
			lessonIds: [lessonThree.id],
		},
	],
};

export const fixtureContent = {
	tracks: [foundationTrack],
	lessons: [lessonOne, lessonTwo, lessonThree],
	quizzes,
};

/** Picks answers by option id for every question, "a" being right. */
export function answersFor(quiz: Quiz, picks: string[]) {
	return Object.fromEntries(
		quiz.questions.map((item, index) => [item.id, picks[index] ?? "b"]),
	);
}
