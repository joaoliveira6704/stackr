<script setup lang="ts">
import { useI18n } from "vue-i18n";
import StackrLogo from "./StackrLogo.vue";

const { t } = useI18n();
</script>

<template>
	<footer class="px-3 pb-3 sm:px-6 sm:pb-5">
		<div
			class="glass mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-panel px-7 py-8 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex flex-col gap-1">
				<StackrLogo />
				<p class="text-sm text-ink-muted">{{ t("footer.tagline") }}</p>
			</div>
			<p class="max-w-xs text-xs text-ink-faint sm:text-right">
				{{ t("footer.disclaimer") }}
			</p>
		</div>
	</footer>
</template>
