import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAuth } from "./use-auth";
import { useConfirm } from "./use-confirm";

// Every logout button goes through here, so they all ask the same question.
export function useLogout() {
	const { signOut } = useAuth();
	const { confirm } = useConfirm();
	const { t } = useI18n();
	const router = useRouter();

	async function logOut(): Promise<boolean> {
		const confirmed = await confirm({
			title: t("logoutConfirm.title"),
			message: t("logoutConfirm.message"),
			confirmLabel: t("logoutConfirm.confirm"),
			destructive: true,
		});
		if (!confirmed) return false;
		signOut();
		await router.push("/");
		return true;
	}

	return { logOut };
}
