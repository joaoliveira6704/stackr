<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useConfirm } from "../lib/use-confirm";
import AppIcon from "./AppIcon.vue";

const { request, answer } = useConfirm();
const { t } = useI18n();

const TITLE_ID = "confirm-dialog-title";
const MESSAGE_ID = "confirm-dialog-message";

const cancelButton = ref<HTMLButtonElement | null>(null);
const confirmButton = ref<HTMLButtonElement | null>(null);
let focusBeforeOpen: HTMLElement | null = null;

const dialog = ref<HTMLElement | null>(null);

// While the dialog is open the keyboard belongs to it: Escape cancels, Tab
// only moves between its two buttons, and focus that slips outside, for
// example when the window loses and regains focus, is pulled back to Cancel.
function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") {
		event.preventDefault();
		answer(false);
		return;
	}
	if (event.key !== "Tab") return;
	event.preventDefault();
	const next =
		document.activeElement === cancelButton.value
			? confirmButton.value
			: cancelButton.value;
	next?.focus();
}

function keepFocusInside(event: FocusEvent) {
	const target = event.target as Node | null;
	if (target && !dialog.value?.contains(target)) cancelButton.value?.focus();
}

function startListening() {
	window.addEventListener("keydown", handleKeydown);
	document.addEventListener("focusin", keepFocusInside);
}

function stopListening() {
	window.removeEventListener("keydown", handleKeydown);
	document.removeEventListener("focusin", keepFocusInside);
}

// Focus starts on Cancel, so a stray Enter never confirms something
// destructive, and goes back to where it was once the dialog closes.
watch(
	() => request.value,
	async (current, previous) => {
		if (current && !previous) {
			focusBeforeOpen = document.activeElement as HTMLElement | null;
			startListening();
			await nextTick();
			cancelButton.value?.focus();
		} else if (!current && previous) {
			stopListening();
			focusBeforeOpen?.focus();
			focusBeforeOpen = null;
		}
	},
);

onUnmounted(stopListening);
</script>

<template>
	<Transition
		enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
		leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
		enter-from-class="opacity-0"
		leave-to-class="opacity-0"
	>
		<div v-if="request" class="fixed inset-0 z-50 grid place-items-center p-4">
			<div aria-hidden="true" class="scrim absolute inset-0" @click="answer(false)" />
			<div
				role="alertdialog"
				aria-modal="true"
				:aria-labelledby="TITLE_ID"
				:aria-describedby="MESSAGE_ID"
				ref="dialog"
				class="popover relative flex w-full max-w-sm animate-reveal flex-col gap-5 rounded-panel p-6 motion-reduce:animate-none"
			>
				<span
					class="icon-tile icon-tile-lg"
					:class="request.destructive ? 'tone-tangerine' : 'tone-brand'"
				>
					<AppIcon :name="request.destructive ? 'alert' : 'quiz'" :size="24" />
				</span>
				<div>
					<h2 :id="TITLE_ID" class="text-heading">{{ request.title }}</h2>
					<p :id="MESSAGE_ID" class="mt-2 text-ink-muted">{{ request.message }}</p>
				</div>
				<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<button
						ref="cancelButton"
						type="button"
						class="btn-secondary"
						@click="answer(false)"
					>
						{{ request.cancelLabel ?? t("common.cancel") }}
					</button>
					<button
						ref="confirmButton"
						type="button"
						:class="request.destructive ? 'btn-danger' : 'btn-primary'"
						@click="answer(true)"
					>
						{{ request.confirmLabel }}
					</button>
				</div>
			</div>
		</div>
	</Transition>
</template>
