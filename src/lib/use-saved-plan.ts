import { onMounted, type Ref, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { type ErrorCode, errorCode } from "./errors";
import { type ConfirmOptions, useConfirm } from "./use-confirm";

interface SavedPlan {
	load: () => Promise<void>;
	save: () => Promise<void>;
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

	async function save() {
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

	onMounted(load);

	// Leaving with unsaved changes would throw the plan away, so ask first.
	onBeforeRouteLeave(async () => {
		if (!hasUnsavedChanges.value) return true;
		return confirm({ ...leaveQuestion(), destructive: true });
	});

	return { loading, loadError, saving, saveError, justSaved, load, save };
}
