<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { useI18n } from "vue-i18n";
import { dateFromKey } from "../lib/budget";
import {
	type Holding,
	type LogEntry,
	recordLog,
	type SavingsEntry,
} from "../lib/portfolio";
import AppIcon from "./AppIcon.vue";
import type { IconName } from "./icons";
import StatRow from "./StatRow.vue";
import type { Tone } from "./tones";

const props = defineProps<{ entry: Holding | SavingsEntry }>();
const { t, n, d } = useI18n();

const LOOKS: Record<LogEntry["kind"], { icon: IconName; tone: Tone }> = {
	start: { icon: "calendar", tone: "neutral" },
	purchase: { icon: "growth", tone: "grape" },
	deposit: { icon: "savings", tone: "brand" },
};

const isOpen = ref(false);
const listId = useId();
const lines = computed(() => recordLog(props.entry));

// The date sits in the title so the price is never cut off on a narrow card.
function lineTitle(line: LogEntry): string {
	const date = line.date
		? d(dateFromKey(line.date), "dayMonthYear")
		: t("register.log.noDate");
	return t("register.log.line", { kind: t(`register.log.${line.kind}`), date });
}

function lineDetail(line: LogEntry): string | undefined {
	if (line.shares === null || line.pricePerShare === null) return undefined;
	return t("register.log.purchaseDetail", {
		shares: n(line.shares, "shares"),
		price: n(line.pricePerShare, "currency"),
	});
}
</script>

<template>
	<div v-if="lines.length" class="flex flex-col gap-1">
		<button
			type="button"
			class="btn-ghost btn-sm self-start"
			:aria-expanded="isOpen"
			:aria-controls="listId"
			@click="isOpen = !isOpen"
		>
			<AppIcon name="clock" :size="16" />
			{{ t(isOpen ? "register.log.hide" : "register.log.show", { count: lines.length }) }}
		</button>
		<ul v-if="isOpen" :id="listId" class="max-h-72 divide-y divide-line overflow-y-auto">
			<li v-for="line in lines" :key="line.id">
				<StatRow
					:icon="LOOKS[line.kind].icon"
					:tone="LOOKS[line.kind].tone"
					:title="lineTitle(line)"
					:detail="lineDetail(line)"
					:value="n(line.amount, 'currency')"
				/>
			</li>
		</ul>
	</div>
</template>
