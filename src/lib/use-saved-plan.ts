import { onMounted, onUnmounted, type Ref, ref, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { type ErrorCode, errorCode } from "./errors";
import { type ConfirmOptions, useConfirm } from "./use-confirm";

interface SavedPlan {
	load: () => Promise<void>;
	save: () => Promise<void>;
}

export const AUTO_SAVE_DELAY_MS = 400;

interface AutoSave {
	/** The state to watch for changes. */
	source: Ref<unknown>;
	/** False while the plan holds a value that must not be stored. */
	canSave: () => boolean;
}

/**
 * Loading, saving and the question before leaving with unsaved changes, the
 * same on every screen that edits a plan saved on the user, such as the
 * simulator and the budget.
 */
export function useSavedPlan(
	plan: SavedPlan,
	hasUnsavedChanges: Ref<boolean>,
	leaveQuestion: () => ConfirmOptions,
	autoSave?: AutoSave,
) {
	const { confirm } = useConfirm();
	const loading = ref(true);
	const loadError = ref<ErrorCode | null>(null);
	const saving = ref(false);
	const saveError = ref<ErrorCode | null>(null);
	const justSaved = ref(false);

	async function load() {
		loading.value = true;
		loadError.value = null;
		try {
			await plan.load();
		} catch (cause) {
			loadError.value = errorCode(cause);
		} finally {
			loading.value = false;
		}
	}

	let saveInFlight: Promise<void> | null = null;
	let autoSaveTimer: ReturnType<typeof setTimeout> | undefined;

	function save(): Promise<void> {
		saveInFlight ??= sendSave().finally(() => {
			saveInFlight = null;
		});
		return saveInFlight;
	}

	async function sendSave() {
		saving.value = true;
		saveError.value = null;
		try {
			await plan.save();
			justSaved.value = true;
		} catch (cause) {
			saveError.value = errorCode(cause);
		} finally {
			saving.value = false;
		}
	}

	/** Saves until nothing is left, since edits can land during a request. */
	async function saveLatest() {
		clearTimeout(autoSaveTimer);
		if (saveInFlight) await saveInFlight;
		while (hasUnsavedChanges.value && autoSave?.canSave()) {
			await save();
			if (saveError.value) return;
		}
	}

	if (autoSave) {
		watch(
			autoSave.source,
			() => {
				clearTimeout(autoSaveTimer);
				if (!hasUnsavedChanges.value || !autoSave.canSave()) return;
				autoSaveTimer = setTimeout(saveLatest, AUTO_SAVE_DELAY_MS);
			},
			{ deep: true },
		);
		onUnmounted(() => clearTimeout(autoSaveTimer));
	}

	onMounted(load);

	// Leaving with unsaved changes would throw the plan away, so ask first.
	onBeforeRouteLeave(async () => {
		if (autoSave) await saveLatest();
		if (!hasUnsavedChanges.value) return true;
		return confirm({ ...leaveQuestion(), destructive: true });
	});

	return {
		loading,
		loadError,
		saving,
		saveError,
		justSaved,
		load,
		save,
		saveLatest,
	};
}
