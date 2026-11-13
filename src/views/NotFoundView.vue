<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AppIcon from "../components/AppIcon.vue";

const { t } = useI18n();
</script>

<template>
	<section class="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
		<!-- biome-ignore lint/a11y/useAltText: the alt text is bound from i18n -->
		<img
			src="/404.png"
			:alt="t('notFound.imageAlt')"
			class="w-full max-w-md dark:opacity-90"
		/>
		<span class="chip tone-brand">{{ t("notFound.eyebrow") }}</span>
		<h1 class="text-title sm:text-display">
			{{ t("notFound.title") }}
		</h1>
		<p class="text-lead text-ink-muted">{{ t("notFound.detail") }}</p>
		<RouterLink to="/" class="btn-primary">
			<AppIcon name="home" :size="18" />
			{{ t("notFound.goHome") }}
		</RouterLink>
	</section>
</template>
