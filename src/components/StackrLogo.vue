<script setup lang="ts">
import logoSource from "../../public/logo-text.svg?raw";

// The file draws the wordmark in white, which disappears on the light theme.
// Painting it with currentColor lets it follow the text colour of each theme
// while the green icon keeps its own colour.
const logoMarkup = logoSource
	.slice(logoSource.indexOf("<svg"))
	.replaceAll("fill:white", "fill:currentColor");
</script>

<template>
	<span
		role="img"
		aria-label="Stackr"
		class="inline-block h-6 mt-2 text-ink sm:h-8 [&>svg]:block [&>svg]:h-full [&>svg]:w-auto"
		v-html="logoMarkup"
	/>
</template>
