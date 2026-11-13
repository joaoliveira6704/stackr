<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
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
	<div class="flex min-h-screen flex-col">
		<header
			class="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur"
		>
			<div
				class="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6"
			>
				<RouterLink to="/" :aria-label="t('nav.home')">
					<StackrLogo />
				</RouterLink>
				<nav class="flex items-center gap-1.5 text-sm sm:gap-3">
					<template v-if="user">
						<RouterLink
							v-if="user.onboardingDone"
							to="/dashboard"
							class="hidden rounded-full px-3 py-2 sm:inline-flex font-semibold text-ink-muted hover:bg-surface-muted hover:text-ink"
							active-class="!bg-brand/15 !text-brand-strong"
						>
							{{ t("nav.dashboard") }}
						</RouterLink>
						<button
							type="button"
							class="btn-secondary px-4 py-2 text-sm"
							@click="handleSignOut"
						>
							{{ t("nav.logout") }}
						</button>
					</template>
					<template v-else>
						<RouterLink
							to="/login"
							class="hidden rounded-full px-3 py-2 sm:inline-flex font-semibold text-ink-muted hover:bg-surface-muted hover:text-ink"
						>
							{{ t("nav.login") }}
						</RouterLink>
						<RouterLink to="/signup" class="btn-primary px-4 py-2 text-sm">
							{{ t("nav.signup") }}
						</RouterLink>
					</template>
					<LanguageSwitcher />
					<ThemeToggle />
				</nav>
			</div>
		</header>
		<main class="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
			<RouterView />
		</main>
		<AppFooter />
	</div>
</template>
