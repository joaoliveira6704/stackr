<!-- The buy button for anything that costs Stacks. It only asks to unlock;
the parent decides what happens, which always goes through a confirm. -->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useProgressStore } from "../stores/progress";
import AppIcon from "./AppIcon.vue";

const props = defineProps<{ price: number }>();
defineEmits<{ unlock: [] }>();

const progress = useProgressStore();
const { t, n } = useI18n();

const missing = computed(() => Math.max(props.price - progress.stacks, 0));
</script>

<template>
	<div class="flex flex-col items-start gap-1.5">
		<button
			type="button"
			class="btn-primary btn-sm"
			:disabled="missing > 0"
			@click="$emit('unlock')"
		>
			<AppIcon name="stacks" :size="16" />
			<span class="tabular-nums">{{ t("learn.unlock.button", { price: n(price) }) }}</span>
		</button>
		<p v-if="missing > 0" class="text-sm text-ink-muted tabular-nums">
			{{ t("learn.unlock.missing", { amount: n(missing) }) }}
		</p>
	</div>
</template>
