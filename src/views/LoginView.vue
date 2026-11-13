<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import AuthLayout from "../components/AuthLayout.vue";
import TextField from "../components/TextField.vue";
import { type ErrorCode, errorCode } from "../lib/errors";
import { safeRedirect } from "../lib/redirect";
import { useAuth } from "../lib/use-auth";

const { signIn } = useAuth();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref<ErrorCode | null>(null);
const pending = ref(false);

async function handleSubmit() {
	error.value = null;
	pending.value = true;
	try {
		await signIn(email.value, password.value);
		await router.push(safeRedirect(route.query.redirect));
	} catch (cause) {
		error.value = errorCode(cause);
	} finally {
		pending.value = false;
	}
}
</script>

<template>
	<AuthLayout
		:title="t('login.title')"
		:subtitle="t('login.subtitle')"
		:panel-title="t('login.panelTitle')"
		:panel-detail="t('login.panelDetail')"
		panel-image="/social-proof.png"
		:panel-image-alt="t('login.panelImageAlt')"
	>
		<form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
			<TextField
				v-model="email"
				:label="t('common.email')"
				type="email"
				autocomplete="email"
			/>
			<TextField
				v-model="password"
				:label="t('common.password')"
				type="password"
				autocomplete="current-password"
			/>
			<p v-if="error" role="alert" class="text-sm font-semibold text-tangerine-strong">
				{{ t(`errors.${error}`) }}
			</p>
			<button type="submit" :disabled="pending" class="btn-primary mt-2 w-full">
				{{ pending ? t("login.pending") : t("login.submit") }}
			</button>
		</form>
		<p class="mt-6 text-sm text-ink-muted">
			{{ t("login.noAccount") }}
			<RouterLink to="/signup" class="font-semibold text-ink underline">
				{{ t("nav.signup") }}
			</RouterLink>
		</p>
		<p class="mt-3 rounded-2xl border border-glass-border bg-glass px-4 py-3 text-xs text-ink-muted">
			{{ t("login.demo") }}
		</p>
	</AuthLayout>
</template>
