import { readonly, ref } from "vue";

export interface ConfirmOptions {
	title: string;
	message: string;
	/** A verb that says what will happen, such as "Sair", never "OK". */
	confirmLabel: string;
	cancelLabel?: string;
	/** Destructive actions get the warning colour and a warning icon. */
	destructive?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
	resolve: (confirmed: boolean) => void;
}

// One request at a time for the whole app, shown by the single ConfirmDialog
// mounted in App.vue.
const request = ref<ConfirmRequest | null>(null);

function answer(confirmed: boolean): void {
	request.value?.resolve(confirmed);
	request.value = null;
}

function confirm(options: ConfirmOptions): Promise<boolean> {
	// A new question replaces one still on screen, which counts as cancelled.
	answer(false);
	return new Promise((resolve) => {
		request.value = { ...options, resolve };
	});
}

export function useConfirm() {
	return { request: readonly(request), confirm, answer };
}
