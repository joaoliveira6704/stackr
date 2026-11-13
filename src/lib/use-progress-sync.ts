import { ref, watch } from "vue";
import { useProgressStore } from "../stores/progress";
import { type ErrorCode, errorCode } from "./errors";
import { fetchProgress, saveProgress } from "./progress-api";
import { useAuth } from "./use-auth";

// Changes often come in bursts, like XP and Stacks right after a quiz, so
// saving waits a moment and sends them together.
export const SAVE_DELAY_MS = 400;

/**
 * Keeps the progress store and the user's record in db.json in step: loads
 * it when someone signs in, saves it shortly after every change, and clears
 * it on sign out. Called once, in App.vue.
 */
export function useProgressSync() {
	const { user } = useAuth();
	const progress = useProgressStore();
	const syncError = ref<ErrorCode | null>(null);

	let userId: string | null = null;
	let lastSaved = "";
	let saveTimer: ReturnType<typeof setTimeout> | undefined;

	const current = () => JSON.stringify(progress.snapshot());

	async function saveNow() {
		if (!userId) return;
		const snapshot = current();
		if (snapshot === lastSaved) return;
		try {
			await saveProgress(userId, progress.snapshot());
			lastSaved = snapshot;
			syncError.value = null;
		} catch {
			syncError.value = "progressNotSaved";
		}
	}

	async function loadFor(id: string) {
		try {
			const saved = await fetchProgress(id);
			if (saved) progress.load(saved);
			userId = id;
			// A first time user has nothing saved yet, so their current progress,
			// such as the onboarding XP, still counts as unsaved.
			lastSaved = saved ? current() : "";
			syncError.value = null;
			if (!saved) await saveNow();
		} catch (cause) {
			syncError.value = errorCode(cause);
		}
	}

	watch(
		() => user.value?.id,
		(id) => {
			clearTimeout(saveTimer);
			userId = null;
			if (!id) {
				progress.reset();
				return;
			}
			void loadFor(id);
		},
		{ immediate: true },
	);

	progress.$subscribe(() => {
		if (!userId || current() === lastSaved) return;
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => void saveNow(), SAVE_DELAY_MS);
	});

	return { syncError, saveNow };
}
