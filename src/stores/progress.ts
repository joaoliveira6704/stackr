import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { QuizQuestion } from "../content/types";
import { type QuizAnswers, type QuizScore, scoreQuiz } from "../lib/quiz";
import {
	assertWholeAmount,
	levelForXp,
	NO_REWARD,
	type Reward,
	rewardForPassedLesson,
} from "../lib/rewards";
import type { Track } from "../lib/tracks";

function addOnce(list: string[], id: string): void {
	if (!list.includes(id)) list.push(id);
}

export interface QuizOutcome {
	score: QuizScore;
	reward: Reward;
	/** True the first time this lesson is passed. */
	firstCompletion: boolean;
}

/** The part of the progress that is saved per user in db.json. */
export interface ProgressSnapshot {
	xp: number;
	weeklyXp: number;
	stacks: number;
	completedLessons: string[];
	/** Lessons read to the end, which is what unlocks their quiz. */
	lessonsRead: string[];
	quizResults: Record<string, number>;
	lessonsToReview: string[];
	sectionsToReview: Record<string, string[]>;
	quizAttempts: Record<string, number>;
	streak: number;
	lastActivity: string | null;
	badges: string[];
	unlockedContent: string[];
}

export function emptyProgress(): ProgressSnapshot {
	return {
		xp: 0,
		weeklyXp: 0,
		stacks: 0,
		completedLessons: [],
		lessonsRead: [],
		quizResults: {},
		lessonsToReview: [],
		sectionsToReview: {},
		quizAttempts: {},
		streak: 0,
		lastActivity: null,
		badges: [],
		unlockedContent: [],
	};
}

export const useProgressStore = defineStore("progress", () => {
	const track = ref<Track | null>(null);
	const onboardingDone = ref(false);
	const xp = ref(0);
	const weeklyXp = ref(0);
	const stacks = ref(0);
	const completedLessons = ref<string[]>([]);
	const lessonsRead = ref<string[]>([]);
	const quizResults = ref<Record<string, number>>({});
	const lessonsToReview = ref<string[]>([]);
	/** Lesson id mapped to the sections tied to the questions the user missed. */
	const sectionsToReview = ref<Record<string, string[]>>({});
	const quizAttempts = ref<Record<string, number>>({});
	const streak = ref(0);
	const lastActivity = ref<string | null>(null);
	const badges = ref<string[]>([]);
	const unlockedContent = ref<string[]>([]);

	// Derived from XP instead of stored, so the level can never drift out of sync.
	const level = computed(() => levelForXp(xp.value));

	function setTrack(chosen: Track): void {
		track.value = chosen;
	}

	function completeOnboarding(): void {
		onboardingDone.value = true;
	}

	function addXp(amount: number): void {
		assertWholeAmount(amount, "XP");
		xp.value += amount;
		weeklyXp.value += amount;
	}

	function resetWeek(): void {
		weeklyXp.value = 0;
	}

	function addStacks(amount: number): void {
		assertWholeAmount(amount, "Stacks");
		stacks.value += amount;
	}

	function spendStacks(amount: number): void {
		assertWholeAmount(amount, "Stacks");
		if (amount > stacks.value) {
			throw new Error(
				`You need ${amount} Stacks but only have ${stacks.value}.`,
			);
		}
		stacks.value -= amount;
	}

	function unlockContent(contentId: string, cost: number): void {
		if (unlockedContent.value.includes(contentId)) return;
		spendStacks(cost);
		unlockedContent.value.push(contentId);
	}

	function completeLesson(lessonId: string): void {
		addOnce(completedLessons.value, lessonId);
	}

	function registerAttempt(lessonId: string): void {
		quizAttempts.value[lessonId] = (quizAttempts.value[lessonId] ?? 0) + 1;
	}

	function requireReview(lessonId: string): void {
		addOnce(lessonsToReview.value, lessonId);
	}

	function clearReview(lessonId: string): void {
		lessonsToReview.value = lessonsToReview.value.filter(
			(id) => id !== lessonId,
		);
		const { [lessonId]: _cleared, ...rest } = sectionsToReview.value;
		sectionsToReview.value = rest;
	}

	function passLesson(lessonId: string, score: QuizScore, attempt: number) {
		const firstCompletion = !completedLessons.value.includes(lessonId);
		const afterReview = lessonsToReview.value.includes(lessonId);
		completeLesson(lessonId);
		clearReview(lessonId);
		const reward = firstCompletion
			? rewardForPassedLesson({
					correctAnswers: score.correct,
					attempt,
					afterReview,
				})
			: NO_REWARD;
		addXp(reward.xp);
		addStacks(reward.stacks);
		return { reward, firstCompletion };
	}

	// The theory always comes before the quiz (GDD 3.1): a quiz only opens
	// once its lesson has been read to the end.
	function markLessonRead(lessonId: string): void {
		addOnce(lessonsRead.value, lessonId);
	}

	function canTakeQuiz(lessonId: string): boolean {
		return lessonsRead.value.includes(lessonId);
	}

	function failLesson(lessonId: string, score: QuizScore): void {
		// After a fail the user has to go back and read the lesson again.
		lessonsRead.value = lessonsRead.value.filter((id) => id !== lessonId);
		// Failing a retake of a finished lesson never takes the lesson away.
		if (completedLessons.value.includes(lessonId)) return;
		requireReview(lessonId);
		sectionsToReview.value = {
			...sectionsToReview.value,
			[lessonId]: score.sectionsToReview,
		};
	}

	function submitQuiz(
		lessonId: string,
		questions: QuizQuestion[],
		answers: QuizAnswers,
	): QuizOutcome {
		registerAttempt(lessonId);
		const attempt = quizAttempts.value[lessonId];
		const score = scoreQuiz(questions, answers);
		quizResults.value = {
			...quizResults.value,
			[lessonId]: Math.max(quizResults.value[lessonId] ?? 0, score.percent),
		};
		if (score.passed) return { score, ...passLesson(lessonId, score, attempt) };
		failLesson(lessonId, score);
		return { score, reward: NO_REWARD, firstCompletion: false };
	}

	function snapshot(): ProgressSnapshot {
		return {
			xp: xp.value,
			weeklyXp: weeklyXp.value,
			stacks: stacks.value,
			completedLessons: [...completedLessons.value],
			lessonsRead: [...lessonsRead.value],
			quizResults: { ...quizResults.value },
			lessonsToReview: [...lessonsToReview.value],
			sectionsToReview: { ...sectionsToReview.value },
			quizAttempts: { ...quizAttempts.value },
			streak: streak.value,
			lastActivity: lastActivity.value,
			badges: [...badges.value],
			unlockedContent: [...unlockedContent.value],
		};
	}

	function load(saved: ProgressSnapshot): void {
		const value = { ...emptyProgress(), ...saved };
		xp.value = value.xp;
		weeklyXp.value = value.weeklyXp;
		stacks.value = value.stacks;
		completedLessons.value = [...value.completedLessons];
		lessonsRead.value = [...value.lessonsRead];
		quizResults.value = { ...value.quizResults };
		lessonsToReview.value = [...value.lessonsToReview];
		sectionsToReview.value = { ...value.sectionsToReview };
		quizAttempts.value = { ...value.quizAttempts };
		streak.value = value.streak;
		lastActivity.value = value.lastActivity;
		badges.value = [...value.badges];
		unlockedContent.value = [...value.unlockedContent];
	}

	function reset(): void {
		track.value = null;
		onboardingDone.value = false;
		load(emptyProgress());
	}

	function unlockBadge(badgeId: string): void {
		addOnce(badges.value, badgeId);
	}

	return {
		track,
		onboardingDone,
		xp,
		weeklyXp,
		level,
		stacks,
		completedLessons,
		lessonsRead,
		quizResults,
		lessonsToReview,
		sectionsToReview,
		quizAttempts,
		streak,
		lastActivity,
		badges,
		unlockedContent,
		setTrack,
		completeOnboarding,
		addXp,
		resetWeek,
		addStacks,
		spendStacks,
		unlockContent,
		completeLesson,
		registerAttempt,
		requireReview,
		clearReview,
		unlockBadge,
		submitQuiz,
		markLessonRead,
		canTakeQuiz,
		snapshot,
		load,
		reset,
	};
});
