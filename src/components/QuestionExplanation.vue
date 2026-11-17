<script setup lang="ts">
import { ref, useId } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "./AppIcon.vue";

defineProps<{ text: string }>();

const { t } = useI18n();
const revealed = ref(false);
const textId = useId();
</script>

<template>
	<div
		class="group card relative flex flex-col gap-4 transition duration-300 ease-out hover:-translate-y-1 hover:bg-glass-strong has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand motion-reduce:transition-none motion-reduce:hover:translate-y-0"
		:data-revealed="revealed || undefined"
	>
		<!--
			The button stretches over the whole card through its ::after layer, so a
			click anywhere on the card toggles it while keyboard and screen reader
			users still get a real button with aria-expanded. The layer needs z-10
			because the text block is positioned and the icon tiles transform on
			hover, and both would otherwise be painted above it and swallow clicks.
		-->
		<div class="flex items-center gap-4">
			<span
				class="icon-tile tone-sun transition duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transition-none"
			>
				<AppIcon name="explanation" />
			</span>
			<button
				type="button"
				class="flex min-w-0 flex-1 flex-col text-left outline-none after:absolute after:inset-0 after:z-10 after:rounded-card"
				:aria-expanded="revealed"
				:aria-controls="textId"
				@click="revealed = !revealed"
			>
				<span class="font-bold">{{ t("onboarding.explanation.title") }}</span>
				<span class="text-sm text-ink-muted">
					{{ revealed ? t("onboarding.explanation.hideHint") : t("onboarding.explanation.showHint") }}
				</span>
			</button>
			<span
				aria-hidden="true"
				class="icon-tile icon-tile-sm tone-neutral transition duration-300 group-hover:tone-brand motion-reduce:transition-none"
			>
				<AppIcon :name="revealed ? 'hide' : 'show'" :size="18" />
			</span>
		</div>

		<div class="relative">
			<p
				:id="textId"
				:aria-hidden="!revealed"
				class="text-ink-muted blur-md transition duration-500 ease-out group-hover:blur-sm group-data-revealed:text-ink group-data-revealed:blur-none motion-reduce:transition-none"
			>
				{{ text }}
			</p>
			<span
				aria-hidden="true"
				class="chip tone-brand pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 transition duration-300 group-hover:scale-110 group-data-revealed:scale-90 group-data-revealed:opacity-0 motion-reduce:transition-none"
			>
				<AppIcon name="show" :size="14" />
				{{ t("onboarding.explanation.reveal") }}
			</span>
		</div>
	</div>
</template>
