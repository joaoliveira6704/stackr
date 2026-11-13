import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory } from "vue-router";
import { createAppI18n, type Locale } from "../i18n";
import { createAppRouter } from "../router";

// Tests read English by default so failures are easy to follow; the
// Portuguese default is covered on its own in the i18n tests.
export async function mountAt(
	path: string,
	component: object,
	locale: Locale = "en",
) {
	const router = createAppRouter(createMemoryHistory());
	const pinia = createPinia();
	setActivePinia(pinia);
	await router.push(path);
	const wrapper = mount(component, {
		global: { plugins: [router, pinia, createAppI18n(locale)] },
	});
	return { wrapper, router, pinia };
}
