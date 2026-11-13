# Working on stackr

Code, comments, commit messages, docs and your replies stay in English. The app itself speaks Portuguese first. Portuguese from Portugal is the default language of the interface, written in the informal "tu" form, and English is the second language. The demo names and emails in db.json stay in Portuguese.

Write like a normal person. Simple words, short sentences, no jargon when a plain word works. No bullet points or numbered lists in this project, in code comments or in anything you write, and no emojis.

Stackr is a finance app, so keep the interface consistent with Revolut: confident, colourful and still easy to read. The brand colour is the green from the logo (`#4ddf7b`, `brand` in Tailwind), and it carries the screen. The main action is always a green pill button with near-black text (`btn-primary`), secondary actions are outlined pills (`btn-secondary`), and selected or active states use green too. Next to the green there is a small supporting palette, `grape`, `tangerine` and `sun`, used through the tones in `src/components/tones.ts` for icon tiles, tinted panels and stat highlights. Each track keeps its own tone (Foundation green, Strategist grape, Arena tangerine) everywhere it shows up. Headings are big and extra bold in Proxima Nova, the labels under them are small and muted, and the illustrations in `public/` are welcome where they help. Avoid gradients and random colours outside the palette.

The surface style is liquid glass, a glassmorphism look. Soft blurred colour orbs from `AppBackdrop` sit behind every page, and content floats above them on see-through panels that blur and saturate what is behind, with a thin bright rim and a light catching the top edge. Public pages use a floating glass pill navbar near the top of the screen, never a full width bar. Pages inside the app set `layout: "app"` in their route meta and get the compact vertical glass sidebar, centred on the left edge, instead, which shows only icons and expands to show labels on hover or keyboard focus, and becomes a bar of icons along the bottom on phones, where language, theme and logout move into a preferences menu. Glass needs colour behind it, so do not cover the backdrop with solid full width blocks. Every screen must look right in both the light and the dark theme.

## Design system

All styling goes through the design system described in `docs/design-system.md`, so read it before you touch the interface. Tokens in `src/styles/tokens.css` become normal Tailwind classes, such as `bg-brand`, `text-ink-muted`, `text-title`, `rounded-card` and `shadow-glass`, and the named pieces in `src/styles/components.css` cover what we repeat: `glass`, `card`, `card-tint`, `panel`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-sm`, `btn-icon`, `btn-danger`, `chip`, `nav-item`, `sidebar`, the `tone-*` classes, `icon-tile`, `field` and `choice`. Build screens from those plus plain Tailwind for layout and spacing. The logo always comes from `public/` through the `StackrLogo` component. Icons are Lucide icons, always drawn through `AppIcon` with a name from `src/components/icons.ts`, never imported from `lucide-vue-next` in a component and never drawn as inline SVG.

Never hard code a grey, white, black, hex value, font size, radius or shadow in a component, and never write a `style` block or arbitrary values like `rounded-[2rem]` when a token exists. Use the theme colours so they switch with the theme, use the `-strong` shade of a palette colour for text on a tint, and take tones from `src/components/tones.ts` when they depend on data. Prefer Tailwind state variants such as `aria-pressed:` or `:has(:checked)` over class bindings for selected and active states. When the same group of classes shows up a third time, add it to the system and document it in `docs/design-system.md` in the same change.

Money is always shown with tabular figures so the digits line up in a column, amounts sit right aligned in any list, and list rows follow the `StatRow` pattern: an icon tile, a title, a muted detail below it and the value on the right. When you add a screen, make it feel like it has always been part of the same app as the landing, login, sign up, onboarding and dashboard pages that exist today.

## Destructive actions

Any action that is destructive or hard to undo must ask the user to confirm it first, every time. That covers logging out, deleting anything, resetting or losing progress, leaving or changing a track in a way that loses work, spending Stacks and anything else the user could regret with one click. Ask through `useConfirm` in `src/lib/use-confirm.ts`, which shows the single `ConfirmDialog` mounted in `App.vue`, and never use `window.confirm` or build a one off modal. Logging out already goes through `useLogout` in `src/lib/use-logout.ts`, so use that instead of calling `signOut` directly.

Write the question so it stands on its own. The title is a short question about what will happen, such as "Sair da conta?", the message says the consequence in plain words, and the confirm button uses a verb that names the action, never "OK" or "Sim". Pass `destructive: true` so the dialog uses `btn-danger` and the warning icon. Like any other text, the title, message and button labels go through vue-i18n in both languages. The dialog already puts focus on Cancel, closes on Escape or a click outside, and keeps Tab inside it, so do not change that behaviour. Every new destructive action comes with tests that it does nothing until the user confirms and nothing at all when they cancel.

## Translations

Every piece of text a user can see goes through vue-i18n, always. That covers headings, labels, buttons, placeholders, aria labels, page titles, empty states and error messages. Never leave a plain string in a template or a script for something that ends up on screen. Whenever you add or change text, add the key to both `src/i18n/pt.ts` and `src/i18n/en.ts` in the same change, with a real translation in each and not a copy of the other language. The Portuguese file is the source of truth and the English file is typed against it, so a missing key fails the type check. Group keys by screen or feature, the way the files are already organised. The Portuguese locale code is `pt-PT`, not `pt`, because browsers read a bare `pt` as Brazilian Portuguese and format numbers the Brazilian way. Errors are thrown as an `AppError` with a code from `src/lib/errors.ts`, and the code is translated on screen under `errors`. Numbers on screen are formatted with the `n` helper from vue-i18n so they follow the current language.

## Code quality

Write clean code and leave every file a little tidier than you found it. Give variables, functions and components names that say what they are or what they do. Keep functions short and focused on one job. If a function needs a comment to explain what it does, rename it or split it up first. Comments should explain why something is done, not what the code already says.

Do not repeat yourself. When the same logic shows up a second or third time, move it into one shared place. Do not over-engineer either. Build what the feature needs today and keep it simple.

Follow the patterns and folder structure already in the project before you invent new ones. Handle errors on purpose, with clear messages in both languages that help the user. Remove dead code, unused imports and leftover debug logs before you finish. Keep money logic in one place so rounding and formatting stay the same across the app.

## Tests

Every new feature comes with unit tests, written using vitest. Write them in the same change as the feature, not later. Test the behaviour the user cares about, and cover the normal case, the edge cases and the error cases. For money, always test rounding, zero, negative amounts and large values.

Components are mounted in English by default through `src/test/mount.ts`, so failures are easy to read. When a screen adds new text, check the Portuguese version in at least one test as well.

Keep each test small and focused on one thing. Name tests so a failure reads like a sentence that explains what broke. Tests must not depend on each other or on real network calls, so use simple fakes for outside services and for db.json data. Run the full test suite with `bun run test`, which uses Vitest, before you say the work is done. Never use `bun test`, because Bun's own runner cannot run these tests. Fix any test your change breaks. When you fix a bug, add a test that would have caught it.
