import type { Lesson, OneOff, Quiz, TrackContent } from "../content/types";
import { getJson } from "./api";
import { AppError } from "./errors";
import type { Track } from "./tracks";

export function fetchTrack(track: Track): Promise<TrackContent> {
	return getJson<TrackContent>(`/tracks/${track}`);
}

export function fetchLessons(track: Track): Promise<Lesson[]> {
	return getJson<Lesson[]>(`/lessons?trackId=${track}`);
}

export function fetchLesson(lessonId: string): Promise<Lesson> {
	return getJson<Lesson>(`/lessons/${encodeURIComponent(lessonId)}`);
}

export function fetchOneOffs(): Promise<OneOff[]> {
	return getJson<OneOff[]>("/oneOffs");
}

export interface OneOffWithLesson {
	oneOff: OneOff;
	lesson: Lesson;
}

// One-off lessons have no track to filter on, so each one is fetched by the
// id its catalogue entry points at.
export async function fetchOneOffLessons(): Promise<OneOffWithLesson[]> {
	const oneOffs = await fetchOneOffs();
	return Promise.all(
		oneOffs.map(async (oneOff) => ({
			oneOff,
			lesson: await fetchLesson(oneOff.lessonId),
		})),
	);
}

export async function fetchQuiz(lessonId: string): Promise<Quiz> {
	const quizzes = await getJson<Quiz[]>(
		`/quizzes?lessonId=${encodeURIComponent(lessonId)}`,
	);
	const quiz = quizzes[0];
	if (!quiz) throw new AppError("contentNotFound");
	return quiz;
}
