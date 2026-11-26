<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppIcon from "../components/AppIcon.vue";
import FormDialog from "../components/FormDialog.vue";
import ShopItemCard from "../components/ShopItemCard.vue";
import StacksBalance from "../components/StacksBalance.vue";
import ThemePreview from "../components/ThemePreview.vue";
import { SWATCH_CLASSES } from "../components/tones";
import UnlockButton from "../components/UnlockButton.vue";
import UserAvatar from "../components/UserAvatar.vue";
import {
	AVATARS,
	type AvatarId,
	COLOUR_THEMES,
	type ColourThemeId,
	type CosmeticKind,
	DEFAULT_ORBS,
	isAnimatedTheme,
	type PaletteColour,
	shopItemId,
} from "../lib/shop";
import { useAuth } from "../lib/use-auth";
import { useUnlock } from "../lib/use-unlock";
import { type EquippedCosmetics, useProgressStore } from "../stores/progress";

const { user } = useAuth();
const progress = useProgressStore();
const { t } = useI18n();
const { unlock, error } = useUnlock();

interface ShopCard<Id> {
	/** Null for the free default, the look without any item. */
	id: Id | null;
	title: string;
	detail: string;
	price: number;
	/** Level 3 items move, and their card says so. */
	animated: boolean;
}

function owns(kind: CosmeticKind, id: string | null): boolean {
	return id === null || progress.unlockedContent.includes(shopItemId(kind, id));
}

type ThemeCard = ShopCard<ColourThemeId> & { orbs: readonly PaletteColour[] };

// The eye button next to a theme's buy button opens a small dialog with a
// window sample of that theme. Looking costs nothing and changes nothing.
const previewedTheme = ref<ThemeCard | null>(null);

// Buying asks its own question first, so the preview closes before it and the
// two dialogs never sit on top of each other.
function buyPreviewed(card: ThemeCard) {
	previewedTheme.value = null;
	void buy("colourTheme", card);
}

function applyPreviewed(card: ThemeCard) {
	progress.equip("colourTheme", card.id);
	previewedTheme.value = null;
}

const themeItemId = (id: ColourThemeId | null) =>
	shopItemId("colourTheme", id ?? "default");

// The free default comes first, then the static themes and the animated
// ones, in the order of the catalogue.
const themeCards = computed<ThemeCard[]>(() => [
	{
		id: null,
		title: t("shop.defaultTheme"),
		detail: t("shop.defaultThemeDetail"),
		price: 0,
		orbs: DEFAULT_ORBS,
		animated: false,
	},
	...COLOUR_THEMES.map((theme) => ({
		id: theme.id,
		title: t(`shop.themes.${theme.id}.name`),
		detail: t(`shop.themes.${theme.id}.detail`),
		price: theme.price,
		orbs: theme.orbs,
		animated: isAnimatedTheme(theme.id),
	})),
]);

// Every style is shown on the user's own pattern, so they see exactly what
// their picture would look like.
const avatarCards = computed<ShopCard<AvatarId>[]>(() => [
	{
		id: null,
		title: t("shop.defaultAvatar"),
		detail: t("shop.defaultAvatarDetail"),
		price: 0,
		animated: false,
	},
	...AVATARS.map((avatar) => ({
		id: avatar.id,
		title: t(`shop.avatars.${avatar.id}.name`),
		detail: t(`shop.avatars.${avatar.id}.detail`),
		price: avatar.price,
		animated: avatar.level === 3,
	})),
]);

// A purchase the user confirmed is put on straight away, since that is why
// they bought it. A cancelled or refused one leaves everything as it was.
async function buy<Kind extends CosmeticKind>(
	kind: Kind,
	card: ShopCard<EquippedCosmetics[Kind]>,
) {
	const { id } = card;
	if (id === null) return;
	await unlock({ id: shopItemId(kind, id), price: card.price, title: card.title, kind });
	if (owns(kind, id)) progress.equip(kind, id);
}
</script>

<template>
	<div class="flex flex-col gap-10">
		<header class="flex flex-wrap items-end justify-between gap-4">
			<h1 class="text-title">{{ t("shop.title") }}</h1>
			<StacksBalance />
		</header>

		<p v-if="error" role="alert" class="card-tint tone-tangerine font-semibold">
			{{ t(`errors.${error}`) }}
		</p>

		<section aria-labelledby="themes-title" class="flex flex-col gap-4">
			<div>
				<h2 id="themes-title" class="text-heading">{{ t("shop.themesTitle") }}</h2>
				<p class="mt-2 text-ink-muted">{{ t("shop.themesSubtitle") }}</p>
			</div>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<ShopItemCard
					v-for="card in themeCards"
					:key="card.id ?? 'default'"
					:data-item="themeItemId(card.id)"
					:title="card.title"
					:detail="card.detail"
					:price="card.price"
					:tag="card.animated ? t('shop.animatedTag') : undefined"
					:owned="owns('colourTheme', card.id)"
					:in-use="progress.equipped.colourTheme === card.id"
					@buy="buy('colourTheme', card)"
					@apply="progress.equip('colourTheme', card.id)"
				>
					<template #preview>
						<span
							aria-hidden="true"
							class="flex h-10 flex-1 overflow-hidden rounded-field ring-1 ring-line"
						>
							<span
								v-for="colour in new Set(card.orbs)"
								:key="colour"
								class="flex-1"
								:class="SWATCH_CLASSES[colour]"
							/>
						</span>
					</template>
					<template #action>
						<button
							type="button"
							class="btn-secondary btn-icon btn-sm"
							:aria-label="t('shop.preview', { name: card.title })"
							aria-haspopup="dialog"
							data-preview-button
							@click="previewedTheme = card"
						>
							<AppIcon name="show" :size="18" />
						</button>
					</template>
				</ShopItemCard>
			</div>
		</section>

		<FormDialog
			v-if="previewedTheme"
			:title="previewedTheme.title"
			:subtitle="previewedTheme.detail"
			size="small"
			@close="previewedTheme = null"
		>
			<ThemePreview :orbs="previewedTheme.orbs" :animated="previewedTheme.animated" large />
			<div class="flex flex-wrap items-start justify-between gap-3">
				<span v-if="previewedTheme.animated" class="chip tone-grape">
					<AppIcon name="sparkle" :size="14" />
					{{ t("shop.animatedTag") }}
				</span>
				<div class="ml-auto flex flex-wrap items-start justify-end gap-2">
					<button type="button" class="btn-secondary btn-sm" @click="previewedTheme = null">
						{{ t("shop.closePreview") }}
					</button>
					<span
						v-if="progress.equipped.colourTheme === previewedTheme.id"
						class="chip tone-brand self-center"
					>
						<AppIcon name="check" :size="14" />
						{{ t("shop.inUse") }}
					</span>
					<button
						v-else-if="owns('colourTheme', previewedTheme.id)"
						type="button"
						class="btn-primary btn-sm"
						@click="applyPreviewed(previewedTheme)"
					>
						{{ t("shop.apply") }}
					</button>
					<UnlockButton
						v-else
						:price="previewedTheme.price"
						verb="buy"
						@unlock="buyPreviewed(previewedTheme)"
					/>
				</div>
			</div>
		</FormDialog>

		<section aria-labelledby="avatars-title" class="flex flex-col gap-4">
			<div>
				<h2 id="avatars-title" class="text-heading">{{ t("shop.avatarsTitle") }}</h2>
				<p class="mt-2 text-ink-muted">{{ t("shop.avatarsSubtitle") }}</p>
			</div>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<ShopItemCard
					v-for="card in avatarCards"
					:key="card.id ?? 'default'"
					:data-item="shopItemId('avatar', card.id ?? 'default')"
					:title="card.title"
					:detail="card.detail"
					:price="card.price"
					:tag="card.animated ? t('shop.animatedTag') : undefined"
					:owned="owns('avatar', card.id)"
					:in-use="progress.equipped.avatar === card.id"
					@buy="buy('avatar', card)"
					@apply="progress.equip('avatar', card.id)"
				>
					<template #preview>
						<UserAvatar :seed="user?.id ?? ''" :avatar="card.id" />
					</template>
				</ShopItemCard>
			</div>
		</section>

		<section class="card-tint tone-brand flex items-start gap-3">
			<AppIcon name="explanation" class="mt-0.5 shrink-0" />
			<div class="flex flex-col items-start gap-3">
				<div>
					<p class="font-bold">{{ t("shop.tipTitle") }}</p>
					<p class="mt-1 text-sm text-ink">{{ t("shop.tipMessage") }}</p>
				</div>
				<RouterLink to="/learn" class="btn-secondary btn-sm">
					{{ t("shop.goToLearn") }}
					<AppIcon name="arrowRight" :size="16" />
				</RouterLink>
			</div>
		</section>
	</div>
</template>
