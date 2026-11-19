<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ErrorCode } from "../lib/errors";
import AppIcon from "./AppIcon.vue";

// The save button in the header of a screen that edits a plan, with a short
// line under it saying whether the latest changes are saved.
defineProps<{
	label: string;
	savedMessage: string;
	hasUnsavedChanges: boolean;
	saving: boolean;
	justSaved: boolean;
	error: ErrorCode | null;
}>();
defineEmits<{ save: [] }>();
const { t } = useI18n();
</script>

<template>
	<div class="flex flex-col items-end gap-1.5">
		<button
			type="button"
			class="btn-primary"
			:disabled="!hasUnsavedChanges || saving"
			@click="$emit('save')"
		>
			<AppIcon name="save" :size="18" />
			{{ saving ? t("common.saving") : label }}
		</button>
		<p class="text-xs text-ink-muted" aria-live="polite">
			<template v-if="error">
				<span class="font-semibold text-tangerine-strong">{{ t(`errors.${error}`) }}</span>
			</template>
			<template v-else-if="hasUnsavedChanges">{{ t("common.unsaved") }}</template>
			<template v-else-if="justSaved">{{ savedMessage }}</template>
		</p>
	</div>
</template>
