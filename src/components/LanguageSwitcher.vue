<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { LOCALES, type Locale, saveLocale } from "../i18n";

const { locale, t } = useI18n();

function selectLocale(next: Locale) {
	locale.value = next;
	saveLocale(next);
}
</script>

<template>
	<div
		role="group"
		:aria-label="t('nav.language')"
		class="glass flex rounded-full p-0.5 text-xs font-bold shadow-none"
	>
		<button
			v-for="option in LOCALES"
			:key="option"
			type="button"
			:aria-pressed="locale === option"
			class="rounded-full px-2.5 py-1 text-ink-muted uppercase transition-colors hover:text-ink aria-pressed:bg-ink aria-pressed:text-surface"
			@click="selectLocale(option)"
		>
			{{ option }}
		</button>
	</div>
</template>
