<script setup lang="ts">
defineProps<{
	title: string;
	subtitle: string;
	panelTitle: string;
	panelDetail: string;
	panelImage: string;
	panelImageAlt: string;
}>();
</script>

<template>
	<div class="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
		<div class="flex flex-col justify-center py-4 md:px-6">
			<h1 class="text-title">{{ title }}</h1>
			<p class="mt-2 text-ink-muted">{{ subtitle }}</p>
			<div class="mt-8">
				<slot />
			</div>
		</div>
		<aside
			class="panel hidden flex-col justify-between gap-8 bg-brand/12 md:flex"
		>
			<!-- biome-ignore lint/a11y/useAltText: the alt text is bound from i18n -->
			<img
				:src="panelImage"
				:alt="panelImageAlt"
				class="mx-auto max-h-64 w-auto"
			/>
			<div>
				<p class="text-title">{{ panelTitle }}</p>
				<p class="mt-3 max-w-sm text-ink-muted">{{ panelDetail }}</p>
			</div>
		</aside>
	</div>
</template>
