<!-- The loading and error states shared by screens that use useLoad. -->
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ErrorCode } from "../lib/errors";

defineProps<{ loading: boolean; error: ErrorCode | null; loadingText: string }>();
defineEmits<{ retry: [] }>();

const { t } = useI18n();
</script>

<template>
	<p v-if="loading" role="status" class="text-ink-muted">{{ loadingText }}</p>
	<div v-else-if="error" role="alert" class="card flex flex-col items-start gap-4">
		<p class="font-semibold text-tangerine-strong">{{ t(`errors.${error}`) }}</p>
		<button type="button" class="btn-secondary btn-sm" @click="$emit('retry')">
			{{ t("learn.retry") }}
		</button>
	</div>
	<slot v-else />
</template>
