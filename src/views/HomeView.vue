<script setup lang="ts">
import { onMounted, ref } from "vue";

interface User {
	id: string | number;
	name: string;
}

type Status = "loading" | "ready" | "error";

const users = ref<User[]>([]);
const status = ref<Status>("loading");

async function loadUsers() {
	try {
		const res = await fetch("/api/users");
		if (!res.ok) throw new Error("Unexpected API response");
		users.value = (await res.json()) as User[];
		status.value = "ready";
	} catch {
		status.value = "error";
	}
}

onMounted(loadUsers);
</script>

<template>
	<div class="flex flex-col gap-6">
		<h1 class="text-3xl font-bold">Stackr Web App</h1>
		<section>
			<h2 class="font-semibold">Users</h2>
			<p v-if="status === 'loading'" class="text-sm text-neutral-500">
				Loading...
			</p>
			<p v-else-if="status === 'error'" class="text-sm text-red-600">
				Could not load users. Is json-server running? (bun run api)
			</p>
			<template v-else>
				<p v-for="user in users" :key="user.id">Name: {{ user.name }}</p>
			</template>
		</section>
	</div>
</template>
