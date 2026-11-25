<!-- The Stacks balance in the header of every screen where Stacks are spent. -->
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useProgressStore } from "../stores/progress";
import AppIcon from "./AppIcon.vue";

const progress = useProgressStore();
const { t, n } = useI18n();
</script>

<template>
	<p class="chip tone-sun tabular-nums" :aria-label="t('stats.balanceLabel')">
		<AppIcon name="stacks" :size="16" />
		{{ t("stats.balance", { amount: n(progress.stacks) }) }}
	</p>
</template>
