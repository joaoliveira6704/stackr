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
		class="flex rounded-full border border-line p-0.5 text-xs font-bold"
	>
		<button
			v-for="option in LOCALES"
			:key="option"
			type="button"
			:aria-pressed="locale === option"
			class="rounded-full px-2.5 py-1 uppercase transition-colors"
			:class="
				locale === option
					? 'bg-ink text-surface'
					: 'text-ink-muted hover:text-ink'
			"
			@click="selectLocale(option)"
		>
			{{ option }}
		</button>
	</div>
</template>
