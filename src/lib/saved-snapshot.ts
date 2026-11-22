import { computed, type Ref, ref } from "vue";

/**
 * Remembers what a plan looked like when it was last loaded or saved, so a
 * screen can tell whether leaving it would throw changes away.
 */
export function useSavedSnapshot<T>(state: Ref<T>) {
	const snapshot = ref(JSON.stringify(state.value));
	const hasUnsavedChanges = computed(
		() => JSON.stringify(state.value) !== snapshot.value,
	);

	/** Pass what was really sent when the plan may change during a save. */
	function markSaved(saved: string = JSON.stringify(state.value)): void {
		snapshot.value = saved;
	}

	return { hasUnsavedChanges, markSaved };
}
