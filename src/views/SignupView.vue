<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import TextField from "../components/TextField.vue";
import { errorMessage } from "../lib/errors";
import { useAuth } from "../lib/use-auth";

const { signUp } = useAuth();
const router = useRouter();
const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref<string | null>(null);
const pending = ref(false);

async function handleSubmit() {
	error.value = null;
	if (password.value !== confirmPassword.value) {
		error.value = "Passwords do not match.";
		return;
	}
	pending.value = true;
	try {
		await signUp({
			name: name.value,
			email: email.value,
			password: password.value,
		});
		await router.push("/dashboard");
	} catch (cause) {
		error.value = errorMessage(cause);
	} finally {
		pending.value = false;
	}
}
</script>

<template>
	<div class="mx-auto max-w-sm">
		<h1 class="text-2xl font-bold">Sign Up</h1>
		<form class="mt-6 flex flex-col gap-4" @submit.prevent="handleSubmit">
			<TextField v-model="name" label="Name" autocomplete="name" />
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
				autocomplete="new-password"
			/>
			<TextField
				v-model="confirmPassword"
				label="Confirm password"
				type="password"
				autocomplete="new-password"
			/>
			<p v-if="error" class="text-sm text-red-600">{{ error }}</p>
			<button
				type="submit"
				:disabled="pending"
				class="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 disabled:opacity-50"
			>
				{{ pending ? "Creating account..." : "Sign Up" }}
			</button>
		</form>
		<p class="mt-4 text-sm text-neutral-500">
			Already have an account?
			<RouterLink to="/login" class="underline">Login</RouterLink>
		</p>
	</div>
</template>
