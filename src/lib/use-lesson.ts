import { computed } from "vue";
import type { Lesson, OneOff, TrackContent } from "../content/types";
import { type LessonPlace, useProgressStore } from "../stores/progress";
import {
	fetchLesson,
	fetchOneOffs,
	fetchQuiz,
	fetchTrack,
} from "./content-api";
import { AppError } from "./errors";
import { lessonStatuses, nextLessonId, oneOffStatus } from "./learning";
import type { Track } from "./tracks";
import { useAuth } from "./use-auth";
import { useLoad } from "./use-load";

// A core lesson is looked up in the user's own track, and a one-off lesson in
// the shared catalogue. A lesson from another track is reported as not found,
// so not even its title reaches the screen.
async function loadSetting(lesson: Lesson, track: Track) {
	if (lesson.trackId === null) {
		const oneOffs = await fetchOneOffs();
		const oneOff = oneOffs.find((item) => item.lessonId === lesson.id) ?? null;
		return { content: null, oneOff };
	}
	if (lesson.trackId !== track) throw new AppError("contentNotFound");
	return { content: await fetchTrack(track), oneOff: null };
}

function placeOf(
	lessonId: string,
	content: TrackContent | null,
	oneOff: OneOff | null,
): LessonPlace | undefined {
	if (oneOff) return { kind: "oneOff", price: oneOff.price };
	const module = content?.modules.find((item) =>
		item.lessonIds.includes(lessonId),
	);
	return module
		? { kind: "module", moduleId: module.id, lessonIds: module.lessonIds }
		: undefined;
}

/**
 * Loads a lesson together with its track or its one-off entry, and its quiz
 * when asked, and works out where the lesson stands for the signed in user.
 */
export function useLesson(lessonId: string, options = { withQuiz: false }) {
	const { user } = useAuth();
	const progress = useProgressStore();

	const loaded = useLoad(async () => {
		const track = user.value?.track;
		if (!track) throw new AppError("contentNotFound");
		const lesson = await fetchLesson(lessonId);
		const [{ content, oneOff }, quiz] = await Promise.all([
			loadSetting(lesson, track),
			options.withQuiz ? fetchQuiz(lessonId) : Promise.resolve(null),
		]);
		return { content, oneOff, lesson, quiz };
	});

	const status = computed(() => {
		const data = loaded.data.value;
		if (data?.oneOff) return oneOffStatus(data.oneOff, progress);
		return data?.content
			? lessonStatuses(data.content, progress)[lessonId]
			: undefined;
	});

	const nextLesson = computed(() => {
		const content = loaded.data.value?.content;
		return content ? nextLessonId(content, progress) : null;
	});

	const place = computed(() => {
		const data = loaded.data.value;
		return data ? placeOf(lessonId, data.content, data.oneOff) : undefined;
	});

	return { ...loaded, status, nextLesson, place };
}
