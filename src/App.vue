<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AppBackdrop from "./components/AppBackdrop.vue";
import AppFooter from "./components/AppFooter.vue";
import LanguageSwitcher from "./components/LanguageSwitcher.vue";
import StackrLogo from "./components/StackrLogo.vue";
import ThemeToggle from "./components/ThemeToggle.vue";
import { useAuth } from "./lib/use-auth";

const { user, signOut } = useAuth();
const { t } = useI18n();
const router = useRouter();

function handleSignOut() {
	signOut();
	void router.push("/");
}
</script>

<template>
	<div class="relative isolate flex min-h-screen flex-col">
		<AppBackdrop />
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
							active-class="!bg-brand/15 !text-brand-strong"
						>
							{{ t("nav.dashboard") }}
						</RouterLink>
						<button
							type="button"
							class="btn-secondary btn-sm"
							@click="handleSignOut"
						>
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
		<main class="mx-auto w-full max-w-5xl flex-1 px-6 pt-32 pb-14 sm:pt-36">
			<RouterView />
		</main>
		<AppFooter />
	</div>
</template>
