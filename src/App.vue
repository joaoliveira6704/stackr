<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppBackdrop from "./components/AppBackdrop.vue";
import AppFooter from "./components/AppFooter.vue";
import AppSidebar from "./components/AppSidebar.vue";
import PublicNavbar from "./components/PublicNavbar.vue";

const route = useRoute();
const isAppLayout = computed(() => route.meta.layout === "app");
</script>

<template>
	<div class="relative isolate flex min-h-screen flex-col">
		<AppBackdrop />
		<template v-if="isAppLayout">
			<AppSidebar />
			<main class="mx-auto w-full max-w-5xl flex-1 px-6 pt-10 pb-28 md:pr-8 md:pb-14 md:pl-32">
				<RouterView />
			</main>
		</template>
		<template v-else>
			<PublicNavbar />
			<main class="mx-auto w-full max-w-5xl flex-1 px-6 pt-32 pb-14 sm:pt-36">
				<RouterView />
			</main>
			<AppFooter />
		</template>
	</div>
</template>
