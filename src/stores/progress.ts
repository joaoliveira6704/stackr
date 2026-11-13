import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { assertWholeAmount, levelForXp } from "../lib/rewards";

export type Track = "foundation" | "strategist" | "arena";

function addOnce(list: string[], id: string): void {
	if (!list.includes(id)) list.push(id);
}

export const useProgressStore = defineStore("progress", () => {
	const track = ref<Track | null>(null);
	const onboardingDone = ref(false);
	const xp = ref(0);
	const weeklyXp = ref(0);
	const stacks = ref(0);
	const completedLessons = ref<string[]>([]);
	const quizResults = ref<Record<string, number>>({});
	const lessonsToReview = ref<string[]>([]);
	const quizAttempts = ref<Record<string, number>>({});
	const streak = ref(0);
	const lastActivity = ref<Date | null>(null);
	const badges = ref<string[]>([]);
	const unlockedContent = ref<string[]>([]);

	// Derived from XP instead of stored, so the level can never drift out of sync.
	const level = computed(() => levelForXp(xp.value));

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
		quizResults,
		lessonsToReview,
		quizAttempts,
		streak,
		lastActivity,
		badges,
		unlockedContent,
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
	};
});
