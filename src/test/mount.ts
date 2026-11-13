import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { type Component, defineComponent, h } from "vue";
import { createMemoryHistory } from "vue-router";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { createAppI18n, type Locale } from "../i18n";
import { createAppRouter } from "../router";

// Tests read English by default so failures are easy to follow; the
// Portuguese default is covered on its own in the i18n tests. The confirm
// dialog is mounted next to the component, as it is in App.vue, so flows that
// ask for confirmation can be tested end to end.
export async function mountAt(
	path: string,
	component: Component,
	locale: Locale = "en",
) {
	const router = createAppRouter(createMemoryHistory());
	const pinia = createPinia();
	setActivePinia(pinia);
	await router.push(path);
	const host = defineComponent({
		render: () => [h(component), h(ConfirmDialog)],
	});
	const wrapper = mount(host, {
		global: { plugins: [router, pinia, createAppI18n(locale)] },
	});
	return { wrapper, router, pinia };
}

export async function answerConfirmDialog(
	wrapper: VueWrapper,
	choice: "confirm" | "cancel",
) {
	const dialog = wrapper.get('[role="alertdialog"]');
	const buttons = dialog.findAll("button");
	await buttons[choice === "confirm" ? 1 : 0].trigger("click");
	await flushPromises();
}
