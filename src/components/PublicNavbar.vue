<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAuth } from "../lib/use-auth";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import StackrLogo from "./StackrLogo.vue";
import ThemeToggle from "./ThemeToggle.vue";

const { user, signOut } = useAuth();
const { t } = useI18n();
const router = useRouter();

function handleSignOut() {
	signOut();
	void router.push("/");
}
</script>

<template>
	<header class="fixed inset-x-0 top-3 z-20 px-3 sm:top-5 sm:px-6">
		<div
			class="glass mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-full py-2 pr-2 pl-5"
		>
			<RouterLink to="/" :aria-label="t('nav.home')">
				<StackrLogo />
			</RouterLink>
			<nav class="flex items-center gap-1.5 text-sm sm:gap-2">
				<template v-if="user">
					<RouterLink
						v-if="user.onboardingDone"
						to="/dashboard"
						class="btn-ghost btn-sm max-sm:hidden"
					>
						{{ t("nav.dashboard") }}
					</RouterLink>
					<button type="button" class="btn-secondary btn-sm" @click="handleSignOut">
						{{ t("nav.logout") }}
					</button>
				</template>
				<template v-else>
					<RouterLink to="/login" class="btn-ghost btn-sm max-sm:hidden">
						{{ t("nav.login") }}
					</RouterLink>
					<RouterLink to="/signup" class="btn-primary btn-sm">
						{{ t("nav.signup") }}
					</RouterLink>
				</template>
				<LanguageSwitcher />
				<ThemeToggle />
			</nav>
		</div>
	</header>
</template>
