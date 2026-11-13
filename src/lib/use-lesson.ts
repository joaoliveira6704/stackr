import { computed } from "vue";
import { useProgressStore } from "../stores/progress";
import { fetchLesson, fetchQuiz, fetchTrack } from "./content-api";
import { AppError } from "./errors";
import { lessonStatuses, nextLessonId } from "./learning";
import { useAuth } from "./use-auth";
import { useLoad } from "./use-load";

/**
 * Loads a lesson together with its track, and its quiz when asked, and works
 * out where the lesson stands for the signed in user. A lesson from another
 * track has no status, so it counts as locked.
 */
export function useLesson(lessonId: string, options = { withQuiz: false }) {
	const { user } = useAuth();
	const progress = useProgressStore();

	const loaded = useLoad(async () => {
		const track = user.value?.track;
		if (!track) throw new AppError("contentNotFound");
		const [content, lesson, quiz] = await Promise.all([
			fetchTrack(track),
			fetchLesson(lessonId),
			options.withQuiz ? fetchQuiz(lessonId) : Promise.resolve(null),
		]);
		return { content, lesson, quiz };
	});

	const status = computed(() => {
		const data = loaded.data.value;
		return data ? lessonStatuses(data.content, progress)[lessonId] : undefined;
	});

	const nextLesson = computed(() => {
		const data = loaded.data.value;
		return data ? nextLessonId(data.content, progress) : null;
	});

	return { ...loaded, status, nextLesson };
}
