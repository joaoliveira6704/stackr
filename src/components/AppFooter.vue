<script setup lang="ts">
import { useI18n } from "vue-i18n";
import StackrLogo from "./StackrLogo.vue";

const { t } = useI18n();
</script>

<template>
	<footer class="border-t border-line">
		<div
			class="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-10 sm:flex-row sm:items-center sm:justify-between"
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
