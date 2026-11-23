import type { TrackContent } from "../content/types";

export type LessonStatus = "locked" | "available" | "review" | "done";

export interface LearningProgress {
	completedLessons: readonly string[];
	lessonsToReview: readonly string[];
}

// Strategist users choose the order of the modules themselves (GDD 6.1), so
// every module is open to them. The other tracks unlock modules in order.
function modulesAreFree(content: TrackContent): boolean {
	return content.id === "strategist";
}

function isModuleDone(lessonIds: string[], progress: LearningProgress) {
	return lessonIds.every((id) => progress.completedLessons.includes(id));
}

export function lessonStatuses(
	content: TrackContent,
	progress: LearningProgress,
): Record<string, LessonStatus> {
	const statuses: Record<string, LessonStatus> = {};
	let previousModuleDone = true;
	for (const module of content.modules) {
		const moduleOpen = modulesAreFree(content) || previousModuleDone;
		let previousLessonDone = true;
		for (const lessonId of module.lessonIds) {
			if (progress.completedLessons.includes(lessonId)) {
				statuses[lessonId] = "done";
			} else if (progress.lessonsToReview.includes(lessonId)) {
				statuses[lessonId] = "review";
			} else if (moduleOpen && previousLessonDone) {
				statuses[lessonId] = "available";
			} else {
				statuses[lessonId] = "locked";
			}
			previousLessonDone = statuses[lessonId] === "done";
		}
		previousModuleDone = isModuleDone(module.lessonIds, progress);
	}
	return statuses;
}

/** The lesson to suggest next: one waiting for review first, then a new one. */
export function nextLessonId(
	content: TrackContent,
	progress: LearningProgress,
): string | null {
	const statuses = lessonStatuses(content, progress);
	const order = content.modules.flatMap((module) => module.lessonIds);
	return (
		order.find((id) => statuses[id] === "review") ??
		order.find((id) => statuses[id] === "available") ??
		null
	);
}

export function canOpenLesson(status: LessonStatus | undefined): boolean {
	return status !== undefined && status !== "locked";
}
