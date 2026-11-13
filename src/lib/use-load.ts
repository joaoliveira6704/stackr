import { type Ref, ref, shallowRef } from "vue";
import { type ErrorCode, errorCode } from "./errors";

/**
 * Loads data for a screen and keeps the loading and error state next to it,
 * so every screen shows the same spinner, error and retry.
 */
export function useLoad<T>(load: () => Promise<T>) {
	const data = shallowRef<T | null>(null) as Ref<T | null>;
	const loading = ref(true);
	const error = ref<ErrorCode | null>(null);

	async function reload() {
		loading.value = true;
		error.value = null;
		try {
			data.value = await load();
		} catch (cause) {
			error.value = errorCode(cause);
		} finally {
			loading.value = false;
		}
	}

	void reload();
	return { data, loading, error, reload };
}
