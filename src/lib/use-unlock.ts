import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useProgressStore } from "../stores/progress";
import { type ErrorCode, errorCode } from "./errors";
import { useConfirm } from "./use-confirm";

export interface UnlockTarget {
	id: string;
	price: number;
	/** Shown in the question, already in the user's language. */
	title: string;
	kind: "module" | "oneOff";
}

/**
 * Buys a module or a one-off lesson with Stacks. Spending Stacks cannot be
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
			title: t(`learn.unlock.${target.kind}Title`),
			message: t("learn.unlock.message", {
				price: n(target.price),
				title: target.title,
				left: n(progress.stacks - target.price),
			}),
			confirmLabel: t("learn.unlock.confirm"),
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
