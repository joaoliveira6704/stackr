<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuth } from "../lib/use-auth";

const { user, signOut } = useAuth();
const router = useRouter();

function handleSignOut() {
	signOut();
	void router.push("/");
}
</script>

<template>
	<div class="flex flex-col gap-6">
		<div>
			<h1 class="text-3xl font-bold">Dashboard</h1>
		</div>

		<div class="rounded border border-neutral-200 p-4">
			<h2 class="font-semibold">Current Session</h2>
			<dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
				<dt class="text-neutral-500">Name</dt>
				<dd>{{ user?.name ?? "—" }}</dd>
				<dt class="text-neutral-500">Email</dt>
				<dd>{{ user?.email ?? "—" }}</dd>
				<dt class="text-neutral-500">ID</dt>
				<dd>{{ user?.id ?? "—" }}</dd>
			</dl>
		</div>

		<div class="flex items-center gap-4">
			<button
				type="button"
				class="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
				@click="handleSignOut"
			>
				Logout
			</button>
			<RouterLink to="/" class="text-sm underline text-neutral-500">
				Back
			</RouterLink>
		</div>
	</div>
</template>
