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

	function markSaved(): void {
		snapshot.value = JSON.stringify(state.value);
	}

	return { hasUnsavedChanges, markSaved };
}
