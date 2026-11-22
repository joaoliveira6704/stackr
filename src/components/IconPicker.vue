<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { RECORD_ICONS, type RecordIcon } from "../lib/portfolio";
import AppIcon from "./AppIcon.vue";

defineProps<{ label: string; defaultIcon: RecordIcon }>();
const icon = defineModel<RecordIcon | null>({ required: true });
const { t } = useI18n();
</script>

<template>
	<div class="flex flex-col gap-1.5">
		<p class="text-label font-semibold text-ink">{{ label }}</p>
		<div class="flex flex-wrap gap-2" role="group" :aria-label="label">
			<button
				type="button"
				class="btn-secondary btn-toggle btn-icon"
				:aria-pressed="icon === null"
				:aria-label="t('register.edit.defaultIcon')"
				:title="t('register.edit.defaultIcon')"
				@click="icon = null"
			>
				<AppIcon :name="defaultIcon" :size="16" />
			</button>
			<button
				v-for="option in RECORD_ICONS"
				:key="option"
				type="button"
				class="btn-secondary btn-toggle btn-icon"
				:aria-pressed="icon === option"
				:aria-label="t(`register.icons.${option}`)"
				:title="t(`register.icons.${option}`)"
				@click="icon = option"
			>
				<AppIcon :name="option" :size="16" />
			</button>
		</div>
	</div>
</template>
