<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "../lib/use-theme";
import AppIcon from "./AppIcon.vue";

const { theme, toggleTheme } = useTheme();
const { t } = useI18n();

const label = computed(() =>
	theme.value === "dark" ? t("nav.lightMode") : t("nav.darkMode"),
);
</script>

<template>
	<button
		type="button"
		:aria-label="label"
		:title="label"
		class="btn-secondary btn-icon"
		@click="toggleTheme"
	>
		<AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="18" />
	</button>
</template>
