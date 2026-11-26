import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useProgressStore } from "../stores/progress";
import { type ErrorCode, errorCode } from "./errors";
import type { CosmeticKind } from "./shop";
import { useConfirm } from "./use-confirm";

export interface UnlockTarget {
	id: string;
	price: number;
	/** Shown in the question, already in the user's language. */
	title: string;
	kind: "module" | "oneOff" | CosmeticKind;
}

/**
 * Buys a module, a one-off lesson or a shop item with Stacks. Spending Stacks cannot be
 * undone, so it always asks first, and it keeps the reason a purchase failed
 * so the screen can explain it.
 */
export function useUnlock() {
	const progress = useProgressStore();
	const { confirm } = useConfirm();
	const { t, n } = useI18n();
	const error = ref<ErrorCode | null>(null);

	async function unlock(target: UnlockTarget): Promise<void> {
		error.value = null;
		const confirmed = await confirm({
			title: t(`unlock.${target.kind}Title`),
			message: t("unlock.message", {
				price: n(target.price),
				title: target.title,
				left: n(progress.stacks - target.price),
			}),
			confirmLabel: t(`unlock.${target.kind}Confirm`),
			destructive: true,
		});
		if (!confirmed) return;
		try {
			progress.unlockContent(target.id, target.price);
		} catch (cause) {
			error.value = errorCode(cause);
		}
	}

	return { unlock, error };
}
