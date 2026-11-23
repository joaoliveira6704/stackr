<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import { paymentStep } from "../lib/budget";
import { roundCents } from "../lib/money";
import AppIcon from "./AppIcon.vue";
import type { PaymentColours } from "./tones";

const props = defineProps<{
	name: string;
	paid: number;
	planned: number;
	colours: PaymentColours;
	status: string;
}>();
const emit = defineEmits<{ change: [amount: number] }>();
const { t, n } = useI18n();

const isTyping = ref(false);
const amountInput = ref<HTMLInputElement | null>(null);
const amountButton = ref<HTMLButtonElement | null>(null);

const limit = computed(() => Math.max(props.paid, props.planned));
const step = computed(() => paymentStep(props.planned));
// The slider only stops on whole steps, so its end rounds up and a drag to the
// end is capped back to the exact amount of the bill.
const sliderMax = computed(() =>
	roundCents(Math.ceil(limit.value / step.value) * step.value),
);
const fillPercent = computed(() =>
	sliderMax.value > 0 ? (props.paid / sliderMax.value) * 100 : 0,
);

function slide(event: Event) {
	const position = (event.target as HTMLInputElement).valueAsNumber;
	emit("change", Math.min(position, limit.value));
}

async function startTyping() {
	isTyping.value = true;
	await nextTick();
	amountInput.value?.select();
}

async function stopTyping() {
	isTyping.value = false;
	await nextTick();
	amountButton.value?.focus();
}

function commitTyped() {
	if (!isTyping.value) return;
	const typed = amountInput.value?.valueAsNumber ?? Number.NaN;
	isTyping.value = false;
	// A field left empty means nothing is paid.
	emit("change", Number.isNaN(typed) ? 0 : typed);
}

function commitAndRefocus() {
	commitTyped();
	void stopTyping();
}
</script>

<template>
	<div class="flex flex-col gap-1">
		<div class="flex items-end justify-between gap-2">
			<div class="flex min-w-0 flex-col">
				<span class="text-xs text-ink-muted">{{ t("budget.category.paid") }}</span>
				<input
					v-if="isTyping"
					ref="amountInput"
					type="number"
					inputmode="decimal"
					min="0"
					step="0.01"
					:value="paid || ''"
					:aria-label="t('budget.category.paidInput', { name })"
					class="field w-28 px-2 py-1 font-bold tabular-nums"
					@keydown.enter.prevent="commitAndRefocus"
					@keydown.esc.prevent="stopTyping"
					@blur="commitTyped"
				/>
				<button
					v-else
					ref="amountButton"
					type="button"
					class="flex cursor-text items-center gap-1 rounded-field text-left text-subheading tabular-nums hover:text-brand-strong"
					:aria-label="t('budget.category.editPaid', { name, amount: n(paid, 'currency') })"
					@click="startTyping"
				>
					{{ n(paid, "currency") }}
					<AppIcon name="manual" :size="14" class="text-ink-muted" />
				</button>
			</div>
			<span class="text-right text-sm font-semibold tabular-nums" :style="{ color: colours.text }">
				{{ status }}
			</span>
		</div>
		<div class="relative flex h-6 items-center">
			<div class="absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-ink/10">
				<div
					class="h-full rounded-full transition-colors duration-300"
					:style="{ width: `${fillPercent}%`, backgroundColor: colours.bar }"
				/>
			</div>
			<input
				type="range"
				min="0"
				:max="sliderMax"
				:step="step"
				:value="paid"
				:disabled="sliderMax === 0"
				:aria-label="t('budget.category.paidSlider', { name })"
				:aria-valuetext="n(paid, 'currency')"
				class="slider relative"
				:style="{ '--slider-colour': colours.bar }"
				@input="slide"
			/>
		</div>
		<div class="flex justify-between text-xs text-ink-muted tabular-nums">
			<span>{{ n(0, "currency") }}</span>
			<span>{{ n(planned, "currency") }}</span>
		</div>
	</div>
</template>
