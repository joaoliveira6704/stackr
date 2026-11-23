<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ErrorCode } from "../lib/errors";
import AppIcon from "./AppIcon.vue";

// Tells the user where their changes stand on a screen that saves by itself.
defineProps<{
	savedMessage: string;
	retryLabel: string;
	hasUnsavedChanges: boolean;
	canSave: boolean;
	saving: boolean;
	justSaved: boolean;
	error: ErrorCode | null;
}>();
defineEmits<{ retry: [] }>();
const { t } = useI18n();
</script>

<template>
	<div class="flex min-h-8 flex-wrap items-center justify-end gap-2" aria-live="polite">
		<template v-if="error">
			<span class="text-sm font-semibold text-tangerine-strong">{{ t(`errors.${error}`) }}</span>
			<button type="button" class="btn-secondary btn-sm" @click="$emit('retry')">
				{{ retryLabel }}
			</button>
		</template>
		<span v-else-if="hasUnsavedChanges && !canSave" class="chip tone-tangerine">
			{{ t("common.unsaved") }}
		</span>
		<span v-else-if="saving || hasUnsavedChanges" class="chip tone-neutral">
			{{ t("common.saving") }}
		</span>
		<span v-else-if="justSaved" class="chip tone-brand">
			<AppIcon name="save" :size="14" />
			{{ savedMessage }}
		</span>
	</div>
</template>
