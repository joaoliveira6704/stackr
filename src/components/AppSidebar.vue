<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useLocale } from "../i18n/use-locale";
import { useLogout } from "../lib/use-logout";
import { useTheme } from "../lib/use-theme";
import AppIcon from "./AppIcon.vue";
import type { IconName } from "./icons";
import SidebarItem from "./SidebarItem.vue";
import ThemeSwitch from "./ThemeSwitch.vue";

const { logOut } = useLogout();
const { theme, toggleTheme } = useTheme();
const { toggleLocale } = useLocale();
const { t } = useI18n();
const route = useRoute();

const PREFERENCES_MENU_ID = "preferences-menu";
const preferencesOpen = ref(false);

interface Preference {
	key: string;
	icon: IconName;
	label: string;
	hint?: string;
	/** Set for options that are an on and off switch rather than an action. */
	switchState?: "on" | "off";
	run: () => void;
}

// Shown in the sidebar on larger screens and in the preferences menu on
// phones, so both places always offer the same actions.
const preferences = computed<Preference[]>(() => [
	{
		key: "language",
		icon: "globe",
		label: t("nav.otherLanguage"),
		hint: t("nav.switchLanguage"),
		run: toggleLocale,
	},
	{
		key: "theme",
		icon: "moon",
		label: t("nav.darkModeSwitch"),
		switchState: theme.value === "dark" ? "on" : "off",
		run: toggleTheme,
	},
	{ key: "logout", icon: "logout", label: t("nav.logout"), run: logOut },
]);

function closePreferences() {
	preferencesOpen.value = false;
}

// A switch keeps the menu open so the user sees it flip. Any other option
// is a one off action, so the menu closes.
function choosePreference(preference: Preference) {
	if (!preference.switchState) closePreferences();
	preference.run();
}

function closeOnEscape(event: KeyboardEvent) {
	if (event.key === "Escape") closePreferences();
}

watch(() => route.path, closePreferences);
onMounted(() => window.addEventListener("keydown", closeOnEscape));
onUnmounted(() => window.removeEventListener("keydown", closeOnEscape));
</script>

<template>
	<nav :aria-label="t('nav.mainNavigation')" class="sidebar">
		<RouterLink
			to="/"
			:aria-label="t('nav.home')"
			class="nav-item mb-1 hover:bg-transparent max-md:hidden"
		>
			<img src="/logo-icon.svg" alt="" class="h-6 w-5 shrink-0 object-contain" />
			<span aria-hidden="true" class="sidebar-label text-xl font-extrabold text-ink">
				stackr
			</span>
		</RouterLink>

		<SidebarItem to="/dashboard" icon="dashboard" :label="t('nav.dashboard')" />
		<SidebarItem to="/profile" icon="user" :label="t('nav.profile')" />

		<div class="contents max-md:hidden">
			<div aria-hidden="true" class="mx-3 my-2 h-px shrink-0 bg-line" />
			<SidebarItem
				v-for="preference in preferences"
				:key="preference.key"
				:icon="preference.icon"
				:label="preference.label"
				:title="preference.hint"
				:switch-state="preference.switchState"
				@click="preference.run"
			/>
		</div>

		<SidebarItem
			icon="sliders"
			:label="t('nav.preferences')"
			class="md:hidden"
			:aria-expanded="preferencesOpen"
			:aria-controls="PREFERENCES_MENU_ID"
			@click="preferencesOpen = !preferencesOpen"
		/>
	</nav>

	<div
		v-if="preferencesOpen"
		aria-hidden="true"
		class="fixed inset-0 z-30 md:hidden"
		@click="closePreferences"
	/>
	<Transition
		enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
		leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
		enter-from-class="translate-y-2 opacity-0"
		leave-to-class="translate-y-2 opacity-0"
	>
		<div
			v-if="preferencesOpen"
			:id="PREFERENCES_MENU_ID"
			role="group"
			:aria-label="t('nav.preferences')"
			class="popover fixed right-3 bottom-[5.25rem] z-40 flex w-60 flex-col gap-1 md:hidden"
		>
			<button
				v-for="preference in preferences"
				:key="preference.key"
				type="button"
				:role="preference.switchState ? 'switch' : undefined"
				:aria-checked="preference.switchState ? preference.switchState === 'on' : undefined"
				:title="preference.hint"
				class="menu-item group/switch"
				@click="choosePreference(preference)"
			>
				<AppIcon :name="preference.icon" class="shrink-0" />
				<span class="flex-1 text-left">{{ preference.label }}</span>
				<ThemeSwitch v-if="preference.switchState" />
			</button>
		</div>
	</Transition>
</template>
