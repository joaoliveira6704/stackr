<script setup lang="ts">
import { onUnmounted, ref, useId, watch } from "vue";
import { useI18n } from "vue-i18n";
import { type ErrorCode, errorCode } from "../lib/errors";
import { searchTickers, type TickerMatch } from "../lib/market";
import type { TickerChoice } from "../stores/portfolio";
import AppIcon from "./AppIcon.vue";

defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{ pick: [choice: TickerChoice] }>();
const { t } = useI18n();

const SEARCH_DELAY_MS = 350;

// Brand names, so they are the same in every language.
const SUGGESTIONS: TickerChoice[] = [
	{ symbol: "VWCE.DE", name: "Vanguard FTSE All-World", kind: "etf" },
	{ symbol: "IWDA.AS", name: "iShares Core MSCI World", kind: "etf" },
	{ symbol: "AAPL", name: "Apple", kind: "stock" },
	{ symbol: "BTC-EUR", name: "Bitcoin", kind: "crypto" },
];

const query = ref("");
const results = ref<TickerMatch[]>([]);
const searching = ref(false);
const error = ref<ErrorCode | null>(null);
const resultsId = useId();
let timer: ReturnType<typeof setTimeout> | undefined;
// Only the answer to the latest search counts, an older one that arrives
// late must not replace it.
let latestSearch = 0;

async function runSearch(text: string) {
	const searchNumber = ++latestSearch;
	searching.value = true;
	error.value = null;
	try {
		const matches = await searchTickers(text);
		if (searchNumber === latestSearch) results.value = matches;
	} catch (cause) {
		if (searchNumber === latestSearch) error.value = errorCode(cause);
	} finally {
		if (searchNumber === latestSearch) searching.value = false;
	}
}

watch(query, (text) => {
	clearTimeout(timer);
	results.value = [];
	if (!text.trim()) {
		latestSearch++;
		searching.value = false;
		error.value = null;
		return;
	}
	timer = setTimeout(() => void runSearch(text), SEARCH_DELAY_MS);
});

onUnmounted(() => clearTimeout(timer));

function pick(choice: TickerChoice) {
	emit("pick", choice);
	query.value = "";
}
</script>

<template>
	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1.5 text-label font-semibold text-ink">
			{{ t("simulator.search.label") }}
			<span class="relative flex items-center">
				<AppIcon name="search" :size="18" class="pointer-events-none absolute left-4 text-ink-muted" />
				<input
					v-model="query"
					type="search"
					autocomplete="off"
					:disabled="disabled"
					:placeholder="t('simulator.search.placeholder')"
					:aria-controls="resultsId"
					class="field pl-11 font-normal disabled:opacity-50"
				/>
			</span>
		</label>

		<div :id="resultsId" aria-live="polite">
			<p v-if="searching" class="text-sm text-ink-muted">{{ t("simulator.search.searching") }}</p>
			<p v-else-if="error" class="text-sm font-semibold text-tangerine-strong">
				{{ t(`errors.${error}`) }}
			</p>
			<p v-else-if="query.trim() && !results.length" class="text-sm text-ink-muted">
				{{ t("simulator.search.noResults") }}
			</p>

			<ul v-if="results.length" class="popover flex flex-col gap-0.5">
				<li v-for="result in results" :key="result.symbol">
					<button
						type="button"
						class="menu-item h-auto py-2.5 text-left whitespace-normal"
						:disabled="disabled"
						@click="pick(result)"
					>
						<span class="min-w-0 flex-1">
							<span class="block truncate">{{ result.name }}</span>
							<span class="block text-xs font-normal text-ink-muted">
								{{ result.symbol }}<template v-if="result.exchange"> · {{ result.exchange }}</template>
							</span>
						</span>
						<span class="chip tone-neutral">{{ t(`simulator.kinds.${result.kind}`) }}</span>
					</button>
				</li>
			</ul>

			<div v-else-if="!query.trim()" class="flex flex-wrap items-center gap-2">
				<span class="text-sm text-ink-muted">{{ t("simulator.search.popular") }}</span>
				<button
					v-for="suggestion in SUGGESTIONS"
					:key="suggestion.symbol"
					type="button"
					class="btn-secondary btn-sm"
					:disabled="disabled"
					@click="pick(suggestion)"
				>
					<AppIcon name="add" :size="14" />
					{{ suggestion.name }}
				</button>
			</div>
		</div>
	</div>
</template>
