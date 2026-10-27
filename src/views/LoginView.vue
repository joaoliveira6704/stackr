<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import TextField from "../components/TextField.vue";
import { errorMessage } from "../lib/errors";
import { safeRedirect } from "../lib/redirect";
import { useAuth } from "../lib/use-auth";

const { signIn } = useAuth();
const route = useRoute();
const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const pending = ref(false);

async function handleSubmit() {
	error.value = null;
	pending.value = true;
	try {
		await signIn(email.value, password.value);
		await router.push(safeRedirect(route.query.redirect));
	} catch (cause) {
		error.value = errorMessage(cause);
	} finally {
		pending.value = false;
	}
}
</script>

<template>
	<div class="mx-auto max-w-sm">
		<h1 class="text-2xl font-bold">Login</h1>
		<form class="mt-6 flex flex-col gap-4" @submit.prevent="handleSubmit">
			<TextField
				v-model="email"
				label="Email"
				type="email"
				autocomplete="email"
			/>
			<TextField
				v-model="password"
				label="Password"
				type="password"
				autocomplete="current-password"
			/>
			<p v-if="error" class="text-sm text-red-600">{{ error }}</p>
			<button
				type="submit"
				:disabled="pending"
				class="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 disabled:opacity-50"
			>
				{{ pending ? "Logging in..." : "Login" }}
			</button>
		</form>
		<p class="mt-4 text-sm text-neutral-500">
			Don't have an account?
			<RouterLink to="/signup" class="underline">Sign Up</RouterLink>
		</p>
		<p class="mt-2 text-xs text-neutral-400">Demo: joao@example.com / 123456</p>
	</div>
</template>
