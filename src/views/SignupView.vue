<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AuthLayout from "../components/AuthLayout.vue";
import TextField from "../components/TextField.vue";
import { type ErrorCode, errorCode } from "../lib/errors";
import { ONBOARDING_PATH } from "../lib/onboarding";
import { useAuth } from "../lib/use-auth";

const { signUp } = useAuth();
const { t } = useI18n();
const router = useRouter();
const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref<ErrorCode | null>(null);
const pending = ref(false);

async function handleSubmit() {
	error.value = null;
	if (password.value !== confirmPassword.value) {
		error.value = "passwordsDoNotMatch";
		return;
	}
	pending.value = true;
	try {
		await signUp({
			name: name.value,
			email: email.value,
			password: password.value,
		});
		await router.push(ONBOARDING_PATH);
	} catch (cause) {
		error.value = errorCode(cause);
	} finally {
		pending.value = false;
	}
}
</script>

<template>
	<AuthLayout
		:title="t('signup.title')"
		:subtitle="t('signup.subtitle')"
		:panel-title="t('signup.panelTitle')"
		:panel-detail="t('signup.panelDetail')"
		panel-image="/hero-image.png"
		:panel-image-alt="t('signup.panelImageAlt')"
	>
		<form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
			<TextField v-model="name" :label="t('signup.name')" autocomplete="name" />
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
				autocomplete="new-password"
			/>
			<TextField
				v-model="confirmPassword"
				:label="t('signup.confirmPassword')"
				type="password"
				autocomplete="new-password"
			/>
			<p v-if="error" role="alert" class="text-sm font-semibold text-tangerine-strong">
				{{ t(`errors.${error}`) }}
			</p>
			<button type="submit" :disabled="pending" class="btn-primary mt-2 w-full">
				{{ pending ? t("signup.pending") : t("signup.submit") }}
			</button>
		</form>
		<p class="mt-6 text-sm text-ink-muted">
			{{ t("signup.haveAccount") }}
			<RouterLink to="/login" class="font-semibold text-ink underline">
				{{ t("nav.login") }}
			</RouterLink>
		</p>
	</AuthLayout>
</template>
