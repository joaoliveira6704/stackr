<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuth } from "./lib/use-auth";

const { user, signOut } = useAuth();
const router = useRouter();

function handleSignOut() {
	signOut();
	void router.push("/");
}
</script>

<template>
	<header
		class="flex items-center justify-between border-b border-neutral-200 px-8 py-4"
	>
		<RouterLink to="/" class="text-lg font-bold">Stackr</RouterLink>
		<nav class="flex items-center gap-4 text-sm">
			<template v-if="user">
				<RouterLink to="/dashboard">Dashboard</RouterLink>
				<span class="text-neutral-500">{{ user.name }}</span>
				<button
					type="button"
					class="rounded border border-neutral-300 px-3 py-1 hover:bg-neutral-100"
					@click="handleSignOut"
				>
					Logout
				</button>
			</template>
			<template v-else>
				<RouterLink to="/login">Login</RouterLink>
				<RouterLink
					to="/signup"
					class="rounded bg-neutral-900 px-3 py-1 text-white hover:bg-neutral-700"
				>
					Sign Up
				</RouterLink>
			</template>
		</nav>
	</header>
	<main class="mx-auto w-full max-w-4xl px-8 py-8">
		<RouterView />
	</main>
</template>
