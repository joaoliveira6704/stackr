<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useId } from "vue";

defineProps<{ title: string; subtitle?: string }>();
const emit = defineEmits<{ close: [] }>();

const titleId = useId();
const dialog = ref<HTMLElement | null>(null);
let focusBeforeOpen: HTMLElement | null = null;

const FOCUSABLE =
	'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function focusableInside(): HTMLElement[] {
	return Array.from(dialog.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
}

// Tab wraps around inside the dialog, so the keyboard never reaches the page
// behind the scrim while it is open.
function keepTabInside(event: KeyboardEvent) {
	const focusable = focusableInside();
	if (!focusable.length) return;
	const first = focusable[0];
	const last = focusable[focusable.length - 1];
	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") {
		event.preventDefault();
		emit("close");
	} else if (event.key === "Tab") {
		keepTabInside(event);
	}
}

onMounted(async () => {
	focusBeforeOpen = document.activeElement as HTMLElement | null;
	await nextTick();
	focusableInside()[0]?.focus();
});

onUnmounted(() => focusBeforeOpen?.focus());
</script>

<template>
	<div class="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
		<div aria-hidden="true" class="scrim fixed inset-0" @click="emit('close')" />
		<div
			ref="dialog"
			role="dialog"
			aria-modal="true"
			:aria-labelledby="titleId"
			class="popover relative flex w-full max-w-lg animate-reveal flex-col gap-5 rounded-panel p-6 motion-reduce:animate-none"
			@keydown="handleKeydown"
		>
			<div>
				<h2 :id="titleId" class="text-heading">{{ title }}</h2>
				<p v-if="subtitle" class="mt-1 text-sm text-ink-muted">{{ subtitle }}</p>
			</div>
			<slot />
		</div>
	</div>
</template>
