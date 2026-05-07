# `/bian-data-model` — LeafyGreen Polish & Fine-Tune Plan

> Skill-graph driven. Built against `skill:leafygreen-ui` v1.0.0 (`schema:react-artifact:v1`),
> tokens from `params:leafygreen-ui:default`, components from the `dataDisplay`,
> `feedback`, `form`, `layout`, `navigation`, `utility` catalogues.
> Replaces the prior prose audit; this version cites exact token paths.

Status: **proposal — not yet executed**. Phases land independently and ship green.

---

## 0. Source of truth

Every value in this plan comes from the LeafyGreen skill graph, not memory:

- **Palette**: `gray.dark4 #112733`, `gray.dark3 #1C2D38`, `gray.dark1 #5C6C75`, `gray.base #889397`, `gray.light2 #E8EDEB`, `gray.light3 #F9FBFA`, `green.dark3 #023430`, `green.dark2 #00684A`, `green.base #00ED64`, `blue.base #016BF8`, `red.base #DB3030`, `red.light3 #FFEAE5`.
- **Spacing scale**: 0/25/50/100/150/200/300/400/500/600/800/900/1000/1200/1400/1600/1800 → 0,1,2,4,6,8,12,16,20,24,32,36,40,48,56,64,72 px.
- **Border-radius scale**: 0/50/100/150/200/300/400/500/600 → 0,2,4,6,8,12,16,20,24 px.
- **Typography**: H1 48/62 w400, H2 32/40 w400 *(regular — signature LeafyGreen)*, H3 24/28 w500, Subtitle 18/24 w600, Body1 13/20, Body2 16/28, Overline 12/20 w600 uppercase 0.4px.
- **Transitions**: faster 100, default 150, slower 300, slowest 500 ms.
- **Light theme tokens**: text.primary `#001E2B`, text.secondary `#5C6C75`, link `#016BF8`, border.secondary `gray.light2`, background.primary `#FFFFFF`, background.secondary `#F9FBFA`, shadow.1 `0 2px 4px 1px rgba(0,30,43,0.15)`, shadow.2 `0 18px 18px -15px rgba(0,30,43,0.20)`.
- **Focus ring (light)**: `0 0 0 2px #FFFFFF, 0 0 0 4px #016BF8` — **two rings**, blue.base (not blue.light2 as I had).
- **Hover ring (gray)**: `0 0 0 3px #E8EDEB`.
- **A11y rule** from skill: `green.base #00ED64` MUST NEVER be used for text on white — fails WCAG AA. Use `green.dark2 #00684A`.

Component contracts:

- **Card**: `bg = bg.primary`, `borderRadius = radius.600` (24 px), `shadow = shadow.1`, `padding = spacing.600` (24 px). Hover → `shadow.2`.
- **Banner**: `borderLeft 3px solid <variant>`, `padding spacing.400` (16 px), `borderRadius radius.200` (8 px). Variants info/warning/success/danger.
- **Badge**: `radius.100` (4 px), padding `3px 6px`, 12 px / w600 / uppercase / 0.4px letter-spacing.
- **Tabs (active)**: `border-bottom 3px solid green.dark2`, `fontWeight 600`, `color text.primary`, padding `spacing.400`.
- **SideNav**: width 240, bg `gray.dark4`, white text. Active = `borderLeft 3px solid green.base`, bg `green.dark3`, color `green.base`.
- **Table**: header bg `gray.light3`, w600, 12 px uppercase 0.4px, color `text.secondary`, padding `8/16`. Rows: border-bottom `gray.light2`, body1 13/20, hover bg `gray.light3`.
- **Tooltip**: bg `gray.dark3`, color white, `radius.100`, padding `4/8`, 12 px.
- **ExpandableCard**: card with collapsible content. Use for BQ groups, Relationship details, anywhere with disclosable content.

---

## 1. Audit of current `/bian-data-model` against the skill graph

| # | Surface | Current | Skill spec | Verdict |
|---|---|---|---|---|
| 1 | Hero bg | `#1C2D38` (gray.dark3) | per-skill the inverse-primary background can be `gray.dark3` or `gray.dark4` | ✓ valid |
| 2 | Hero border-bottom | `3px solid #00684A` | green.dark2 — fine | ✓ |
| 3 | Stats panels | `rgba(0,30,43,0.55)` | skill has no stat-panel variant, but gray.dark4 (`#112733`) is the canonical inverse panel surface | ⚠ one-off; convert to gray.dark4 + 1px border gray.dark2 |
| 4 | Hero stat radius | 8px | no spec; 8 (radius.200) acceptable | ✓ |
| 5 | Sidebar bg | `#F9FBFA` (light) | Atlas SideNav spec is `gray.dark4` + white text + active `borderLeft 3px green.base` on `green.dark3` | ✗ — sidebar is a light variant; Atlas-style is dark. **Decision needed (Q-1).** |
| 6 | Sidebar item active | `borderLeft 3px d.color`, bg `gray.light2` | spec is `borderLeft 3px green.base`, bg `green.dark3`, color `green.base` | ✗ if going dark; ⚠ if staying light (ok pattern, wrong colors) |
| 7 | Domain header card | radius 12 px, custom border-top accent | Card radius is `radius.600` (24 px) | ⚠ — current 12 is more conservative than spec; either bump to 24 or accept a "compact card" deviation |
| 8 | Field/mapping/index tables | hand-rolled `<table>` + `.tbl` CSS | LG `<Table>` component with `<HeaderRow>`/`<HeaderCell>`/`<Row>`/`<Cell>` | ✗ — should swap to LG primitive |
| 9 | BQ cards | hand-rolled green-headed cards | spec → `<ExpandableCard>` per BQ | ✗ |
| 10 | Relationship cards | hand-rolled white cards | LG `<Card>` is the right primitive | ⚠ |
| 11 | Footer panels (pattern legend, DB map) | hand-rolled cards | LG `<Card>` | ⚠ |
| 12 | Immutable banner | hand-rolled red div | `<Banner variant="danger">` | ✗ |
| 13 | Search input | `TextInput` from `@leafygreen-ui/text-input` | `SearchInput` from `@leafygreen-ui/search-input` per skill component decision | ⚠ |
| 14 | Back button | pill `<button>` w/ slate border | LG `<Button variant="default" leftGlyph={<Icon glyph="ArrowLeft"/>}>` or `<BackLink>` | ⚠ |
| 15 | Focus ring | `0 0 0 2px #C2E5FF` (blue.light2) | spec: `0 0 0 2px #FFFFFF, 0 0 0 4px #016BF8` (white inner + blue.base outer, two rings) | ✗ — wrong colour and structure |
| 16 | Hover ring on interactive items | none | spec: `0 0 0 3px gray.light2` for default; `green.light2` for primary | ✗ |
| 17 | Tabs | LG `<Tabs>` | matches | ✓ |
| 18 | Loading state (Semantic API) | none surfaced (catalog is hardcoded now, never loading) | n/a | ✓ |
| 19 | Empty state — sidebar filter returns nothing | groups silently disappear | LG `emptyState` component (title/description/primaryButton) | ✗ |
| 20 | Body text contrast | mostly `gray.dark1`; some `gray.base` (`#889397`) used as content text in tables/cards | spec: body text must be `gray.dark1` minimum on white. `gray.base` is decorative meta only | ⚠ — audit and lift content text |
| 21 | Card hover | none | spec: `translateY(-2px)` + `shadow.2` for elevatable cards (relationship, BQ) | ✗ |
| 22 | Transitions | `150ms cubic-bezier(0.33, 1, 0.68, 1)` standardized | spec: 100/150/300/500. 150 = "default". curve unspecified — bezier OK | ✓ |
| 23 | `prefers-reduced-motion` | only on back button | spec: respected globally | ⚠ |
| 24 | Touch targets | sidebar buttons ~32 px tall | spec: 44 px min on screens ≤1024 px (WCAG 2.5.8) | ✗ |
| 25 | Sticky hero | not sticky (per your call) | n/a — your override | ✓ |
| 26 | Page max-width | none — content fills viewport | spec: 1400 px for data-heavy routes | ✗ |

Summary: **18 violations or near-misses**, **5 OK**, **3 deferred to your decision**.

---

## 2. Decision points (resolve before Phase B)

- **Q-1 — Sidebar variant.** The skill graph specifies `SideNav` as `gray.dark4` background with white text — Atlas-style. Current sidebar is light (`gray.light3`). Two options:
  - **(a) Atlas dark** — matches skill exactly; visually heavier next to the slate hero (two dark surfaces).
  - **(b) Light variant** — consistent with the page-content surface; deviates from the SideNav spec but stays inside the `gray.light3` "secondary background" token. Active item still applies the canonical `borderLeft 3px green.base` cue.
  - **Recommendation:** (b) light. The page is content-dense and a dark sidebar would compete with the hero. The skill's SideNav spec is for Atlas product-shell navigation; here the sidebar is an in-page domain selector — closer to a section nav.

- **Q-2 — Card radius.** LG `Card` spec is `radius.600` (24 px). Current cards use 12 px. Bumping to 24 px is a noticeable visual change. Options:
  - **(a) Strict 24 px** — full skill compliance.
  - **(b) Keep 12 px** — calling these "compact info panels" not Card, accepting the deviation for density.
  - **Recommendation:** (b) keep 12 px for the inline meta/info panels (they aren't elevation-cards in the spec sense), use full `<Card>` (24 px) only for top-level relationship/BQ tiles.

- **Q-3 — BQ disclosure.** BQ groups currently render fully expanded. Some BQs have 30+ field paths; the page becomes very tall. Options:
  - **(a)** Collapse all BQs by default in `<ExpandableCard>` — user opens what they want.
  - **(b)** Auto-expand the first BQ, others collapsed.
  - **(c)** Always expanded.
  - **Recommendation:** (b) — scannable on entry, doesn't fight the data.

---

## 3. Phased migration

Each phase is one commit and independently shippable.

### Phase A — Token foundation (no visual change)

Land before any visual edits.

- Add `@leafygreen-ui/tokens` as a direct dep (currently transitive).
- Create `frontend/lib/ui/leafygreenTokens.js`. Re-exports from `@leafygreen-ui/palette` + `@leafygreen-ui/tokens`, plus a `uiTokens` object with surface, border, shadow, transition values from the skill graph (see §0). One module, one import point. Documented with skill-graph provenance comment.
- No code consumes it yet.

### Phase B — Hex → token sweep (no visual change)

- Replace every raw hex in `BianDataModelPage.module.css` with the same hex value plus a `/* palette.* */` comment naming the token. Goal: any future maintainer can `Find/Replace` if a token shifts.
- Replace inline `style={{ color: '#…' }}` and `style={{ background: '#…' }}` with `palette.<token>`.
- Drop dead colors and consolidate one-off greens/blues onto canonical palette names.

### Phase C — LG containers

- **Domain meta card**, **Relationship card**, **Footer panels** → LG `<Card>` (radius decision per Q-2).
- **Domain header** → kept as a custom flex card with accent border-top (LG Card lacks an accent slot; documented deviation).
- **BQ groups** → LG `<ExpandableCard>` with `title={bqName}`, `description="N fields"`, `defaultOpen={i === 0}` (per Q-3).
- **Immutable banner** → `<Banner variant="danger">…<Icon glyph="Lock"/> IMMUTABLE — append only…</Banner>`.

### Phase D — LG `<Table>`

Migrate four tables: Collection fields, BIAN Mapping, Indexes, Relationships (currently rendered with `<table>`/`.tbl`):

- Wrap with `<Table>`, build `columns` array, body rows via render-prop pattern per LG 15.x.
- Carry over the section-heading rows (Top-level fields, nested groups in mapping tab) using `<Row>` with `colSpan` cell.
- Keep `BsonTag` and `FieldName` as cell renderers; they already use palette-aligned colors.

### Phase E — Sidebar refactor

- Apply Q-1 decision (light SideNav variant with canonical active treatment).
- Switch `<TextInput placeholder="Search domains…">` → `<SearchInput>` (correct LG primitive for filter use case; comes with clear button).
- Min height 44 px on viewports ≤ 1024 px.
- Empty state when filter returns 0 domains: small dashed-border card with `<Icon glyph="MagnifyingGlass">`, "No domains match", and a "Clear filter" `<Button variant="default" size="small">`.

### Phase F — Focus + hover

- Replace every `box-shadow: 0 0 0 2px #C2E5FF` with the skill-canonical two-ring focus: `0 0 0 2px #FFFFFF, 0 0 0 4px #016BF8`.
- Add hover ring `0 0 0 3px #E8EDEB` to sidebar buttons and back button on `:hover`.
- Card-tier hover (`translateY(-2px) + shadow.2`) on Relationship and BQ cards. CSS-only `:hover`; respect `prefers-reduced-motion`.

### Phase G — Body-text contrast pass

- Audit every text colour against the rule "≥ 4.5:1 on white".
- `gray.base` (`#889397`) → demoted to non-content meta only (separator labels, "—" placeholders, sub-eyebrows). Anywhere it currently colours descriptive text in tables / cards / cells, lift to `gray.dark1` (`#5C6C75`).

### Phase H — Layout & responsive

- Wrap main pane in a max-width 1400 px container per skill data-heavy guidance. Sidebar stays full-bleed.
- Breakpoint behavior:
  - `≤1024 px` — sidebar becomes a `Drawer` (opened via a hamburger button in the hero).
  - `≤768 px` — hero stats wrap to two rows; the CTA button drops below stats.
- `@media (prefers-reduced-motion: reduce)` block applied to all transitions globally.

### Phase I — A11y polish

- Pattern Badges get `aria-label="Pattern: Management"` etc.
- LG `Tabs` is wired with proper roles; verify after Phase C–D refactor.
- `Spinner` / `SkeletonLoader` regions get `role="status"` + `aria-live="polite"`.
- `<Banner>` (immutable) gets `role="alert"` (LG handles by default — verify).
- Run skill graph `check_constraints` against a fact summary of the implemented page; iterate on flagged items.

### Phase J — Final pass

- Standardize transition durations using token names: 100 (color flips), 150 (size/translate), 300 (layout).
- Run a final "Design Completion Checklist" walk per skill SKILL.md.
- Update `docs/bian-data-model-leafygreen-plan.md` to mark phases complete.

---

## 4. Out of scope

- Data: every domain, field, BQ, mapping, relationship stays bit-identical.
- Routing: `/bian-data-model` and `/ledger-flow` stay where they are.
- Sticky hero: per your decision, hero is non-sticky; not revisiting.
- DB-tag in sidebar: per your decision, no per-row DB labels.
- Emoji icons: already replaced; no further work.

---

## 5. Sequencing for review

Land **A → B** first (zero visual change) — pause for review.
Then **C → D → E** (visible refactor of containers, tables, sidebar) — pause again.
Then **F → G → H → I → J** in one batch — final ship.

Three review checkpoints. ~9 commits. Runtime budget: a focused session per checkpoint.
