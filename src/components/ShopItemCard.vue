<!-- One cosmetic in the shop. It buys or applies through events, so the
screen decides what happens, and buying always goes through a confirm. The
`action` slot sits beside the buy or apply button, for extras such as the
preview button of a colour theme. -->
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AppIcon from "./AppIcon.vue";
import UnlockButton from "./UnlockButton.vue";

defineProps<{
	title: string;
	detail: string;
	/** Zero for the free default, which is always owned. */
	price: number;
	/** A short label next to the name, such as "Animado". */
	tag?: string;
	owned: boolean;
	inUse: boolean;
}>();
defineEmits<{ buy: []; apply: [] }>();

const { t } = useI18n();
</script>

<template>
	<article
		class="card flex flex-col gap-4 data-in-use:ring-2 data-in-use:ring-brand"
		:data-in-use="inUse || undefined"
	>
		<div class="flex items-start justify-between gap-3">
			<slot name="preview" />
			<span v-if="inUse" class="chip tone-brand">
				<AppIcon name="check" :size="14" />
				{{ t("shop.inUse") }}
			</span>
			<span v-else-if="price === 0" class="chip tone-neutral">{{ t("shop.free") }}</span>
		</div>
		<div class="flex-1">
			<div class="flex flex-wrap items-center gap-2">
				<h3 class="text-subheading">{{ title }}</h3>
				<span v-if="tag" class="chip tone-grape" data-tag>
					<AppIcon name="sparkle" :size="14" />
					{{ tag }}
				</span>
			</div>
			<p class="mt-1 text-sm text-ink-muted">{{ detail }}</p>
		</div>
		<div class="flex flex-wrap items-start gap-2">
			<button
				v-if="owned"
				type="button"
				class="btn-secondary btn-sm whitespace-nowrap"
				:disabled="inUse"
				@click="$emit('apply')"
			>
				{{ t("shop.apply") }}
			</button>
			<UnlockButton v-else :price="price" verb="buy" @unlock="$emit('buy')" />
			<slot name="action" />
		</div>
	</article>
</template>
