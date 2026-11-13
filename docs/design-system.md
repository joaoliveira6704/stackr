# Stackr design system

Stackr is styled with Tailwind CSS 4 and a small design system on top of it. The goal is that you can build any new screen with normal Tailwind classes plus a handful of named pieces, without writing CSS and without picking colours, sizes or shadows by hand. Everything here works the same in the light and the dark theme.

The styles live in `src/styles`, and `src/styles.css` only imports them in order.

| File | What it holds |
| --- | --- |
| `fonts.css` | Proxima Nova, loaded from `public/fonts` |
| `tokens.css` | Colours, type scale, radius, shadows and blur. Each one becomes a Tailwind class |
| `themes.css` | The light and dark values behind the theme colours |
| `base.css` | Page defaults such as the body colour and the focus ring |
| `components.css` | The named pieces: glass, card, panel, buttons, chips, tones, icon tiles, fields and choices |

## How to think about it

There are three layers. Tokens are the raw values, like the brand green or the card radius, and you use them through ordinary Tailwind classes such as `bg-brand`, `text-title` or `rounded-card`. Components are named utilities for the pieces we repeat, like `card` or `btn-primary`. Layout stays plain Tailwind, so spacing, flex, grid and breakpoints are written as usual next to the component classes.

A typical block reads like this.

```html
<section class="card flex flex-col gap-4">
  <span class="icon-tile icon-tile-lg tone-grape">...</span>
  <h2 class="text-heading">Estratega</h2>
  <p class="text-sm text-ink-muted">Para quem quer investir a longo prazo.</p>
  <button class="btn-primary self-start">Começar</button>
</section>
```

Modifiers such as `btn-sm` or `icon-tile-lg` work through CSS variables, so their order in the class list never matters.

## Colours

Never write a grey, white or black by hand. Use the theme colours, which switch on their own between light and dark.

| Class | Use it for |
| --- | --- |
| `bg-surface` | The page background |
| `bg-surface-muted` | A quiet filled area inside a card |
| `bg-glass`, `bg-glass-strong` | See-through fills, the strong one for hover |
| `text-ink` | Main text |
| `text-ink-muted` | Labels, details and secondary text |
| `text-ink-faint` | Hints and disabled text |
| `border-line`, `border-line-strong` | Dividers and outlines |
| `border-glass-border` | The bright rim of a glass surface |

The palette is the logo green plus three supporting colours. Use the plain colour for fills, like `bg-brand` or `bg-grape/15`, and the `-strong` version for text or icons on a tinted background, because it is darker in light mode and brighter in dark mode so it always stays readable.

| Colour | Fill | Text on a tint | Meaning |
| --- | --- | --- | --- |
| Green | `bg-brand` | `text-brand-strong` | Brand, main actions, selection, Foundation |
| Grape | `bg-grape` | `text-grape-strong` | XP, Strategist |
| Tangerine | `bg-tangerine` | `text-tangerine-strong` | Streaks, risk, errors, Arena |
| Sun | `bg-sun` | `text-sun-strong` | Stacks and rewards |

`text-on-brand` is the near black used on top of a green fill.

## Tones

A tone is a soft tinted background with matching strong text, which is what icon tiles, chips and highlighted cards need. Use `tone-brand`, `tone-grape`, `tone-tangerine`, `tone-sun` or `tone-neutral`. When the tone comes from data, use the maps in `src/components/tones.ts`, `TONE_CLASSES` to turn a tone name into its class and `TRACK_TONES` to get the colour of a track. Write the class out in full rather than building it from a string, because Tailwind only ships classes it can find in the source.

## Type

Each step of the type scale sets size, line height, letter spacing and weight together, so a heading is one class.

| Class | Size | Use it for |
| --- | --- | --- |
| `text-display` | 60px, extra bold | The main heading of a landing style page |
| `text-title` | 36px, extra bold | Page and section headings |
| `text-heading` | 24px, extra bold | Card headings and big values |
| `text-subheading` | 18px, bold | Small headings inside a card |
| `text-lead` | 18px | The intro paragraph under a heading |
| `text-label` | 14px | Form labels |

Big headings step down on phones, for example `text-title sm:text-display`. Body text uses the normal Tailwind sizes like `text-sm`. Numbers and money always add `tabular-nums` so digits line up, and amounts sit on the right in a list.

## Shapes and depth

Use `rounded-tile` for icon tiles, `rounded-field` for inputs and answers, `rounded-card` for cards and `rounded-panel` for large sections. Shadows are limited to `shadow-glass`, which already comes with every glass piece, and `shadow-glow`, the green glow under the main button. Do not add other shadows or gradients.

## Glass

The surface style is liquid glass. The `AppBackdrop` component paints soft blurred orbs of colour behind every page, and content floats above them on see-through surfaces that blur and saturate what is behind, with a thin bright rim and a light catching the top edge. Glass only reads as glass with colour behind it, so avoid solid full width blocks.

| Class | What it is |
| --- | --- |
| `glass` | Any floating glass surface, such as the navbar pill |
| `glass-tint` | Glass without its own fill, to pair with a `bg-*` tint |
| `card` | A rounded glass block with padding, the default container |
| `card-tint` | The same block with no fill, for example `card-tint bg-brand/12` or `card-tint tone-grape` |
| `panel` | A large rounded tinted section with generous padding, for example `panel bg-grape/15` |

## Buttons

| Class | Use it for |
| --- | --- |
| `btn-primary` | The one main action on a screen, green with dark text |
| `btn-secondary` | Any other action, an outlined glass pill |
| `btn-ghost` | Quiet text actions such as navigation links |
| `btn-sm` | The smaller size, added next to any of the above |
| `btn-icon` | A round button that only holds an icon, used with `btn-secondary` |

Buttons already handle hover, press and disabled states. To hide a button on small screens use `max-sm:hidden` instead of `hidden sm:inline-flex`, so the button keeps its own display value.

## Small pieces

`chip` is a pill label and always takes a tone, like `chip tone-brand`. `icon-tile` is the square that holds an icon and also takes a tone, with `icon-tile-sm`, `icon-tile-lg` and `icon-tile-xl` for other sizes. List rows use the `StatRow` component, which already combines an icon tile, a title, a muted detail and a right aligned value.

## Forms

Inputs use `field`, which is what the `TextField` component renders. Selectable answers use `choice`, a label that wraps a hidden radio or checkbox and turns green on its own when the input is checked. Inside it, `choice-key` is the letter badge and `choice-mark` is the round mark at the end. No class binding is needed for the selected state.

## States through variants

Prefer Tailwind state variants over class bindings in the template. The language switcher, for example, styles the active option with `aria-pressed:bg-ink aria-pressed:text-surface`, and answer cards rely on `:has(:checked)` inside `choice`. This keeps the selected look in one place and keeps the markup honest about its state.

## Adding to the system

When the same group of classes shows up a third time, add a token or a component utility instead of copying it again. New colours, sizes or radii go in `tokens.css`, with light and dark values in `themes.css` when they change with the theme. New pieces go in `components.css` as an `@utility` with a short comment saying what it is for, and they should use the tokens rather than raw values. Then add a line about it to this file.
