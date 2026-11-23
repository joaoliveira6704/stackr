import type { Module, OneOff, TrackContent } from "../content/types";

export type LessonStatus = "locked" | "available" | "review" | "done";
export type ModuleStatus = "locked" | "open" | "done";

export interface LearningProgress {
	completedLessons: readonly string[];
	lessonsToReview: readonly string[];
	/** Ids of the modules and one-off lessons bought with Stacks. */
	unlockedContent: readonly string[];
}

// Modules can be bought in any order. A free module, such as the first one of
// every track, is always open.
export function isModuleOpen(module: Module, progress: LearningProgress) {
	return module.price === 0 || progress.unlockedContent.includes(module.id);
}

export function isModuleDone(module: Module, progress: LearningProgress) {
	return module.lessonIds.every((id) => progress.completedLessons.includes(id));
}

export function moduleStatus(
	module: Module,
	progress: LearningProgress,
): ModuleStatus {
	if (!isModuleOpen(module, progress)) return "locked";
	return isModuleDone(module, progress) ? "done" : "open";
}

function lessonStatus(
	lessonId: string,
	canStart: boolean,
	progress: LearningProgress,
): LessonStatus {
	if (progress.completedLessons.includes(lessonId)) return "done";
	if (progress.lessonsToReview.includes(lessonId)) return "review";
	return canStart ? "available" : "locked";
}

// Inside an open module the lessons still go in order, one after another.
export function lessonStatuses(
	content: TrackContent,
	progress: LearningProgress,
): Record<string, LessonStatus> {
	const statuses: Record<string, LessonStatus> = {};
	for (const module of content.modules) {
		let previousLessonDone = isModuleOpen(module, progress);
		for (const lessonId of module.lessonIds) {
			statuses[lessonId] = lessonStatus(lessonId, previousLessonDone, progress);
			previousLessonDone = statuses[lessonId] === "done";
		}
	}
	return statuses;
}

export function oneOffStatus(
	oneOff: OneOff,
	progress: LearningProgress,
): LessonStatus {
	const bought = progress.unlockedContent.includes(oneOff.id);
	return lessonStatus(oneOff.lessonId, bought, progress);
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
