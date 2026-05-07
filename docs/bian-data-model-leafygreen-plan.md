# `/bian-data-model` — LeafyGreen Compliance Migration Plan

Status: **proposal — not yet executed**. Ship in phases per section. Each phase is independently shippable.

---

## 1. Audit of current state

The page (`components/BianDataModel/BianDataModelPage.jsx` + `.module.css`) was built quickly to mirror the consolidated HTML's IA. It uses some LeafyGreen primitives (`Tabs`, `Badge`, `TextInput`, `Button`, `Icon`, typography) but violates several rules from the MongoDB demo design system:

| Rule | Status | Evidence |
|---|---|---|
| All cards `borderRadius: 8px`, `border: 1px solid ${palette.gray.light2}` | ⚠ partial | Cards use 8/12px radius; borders are hardcoded `#E8EDEB` (right value, wrong source) |
| Use `palette.*` from `@leafygreen-ui/palette`, never raw hex | ✗ | ~40+ raw hex literals in CSS module + inline `style={{}}` props |
| Use `spacing[n]` from `@leafygreen-ui/tokens` | ✗ | Raw px throughout (`padding: 18px 24px`, etc.) |
| Header background `palette.green.dark2` | ⚠ | Currently `#001E2B` (green.dark3); should be `green.dark2` (`#023430`) per skill — **needs confirmation** |
| Body text contrast ≥ 4.5:1 — minimum `palette.gray.dark1` on white | ⚠ | Several `#5C6C75`/`#889397` text usages — borderline; verify |
| Use LG `Table` for data grids | ✗ | Raw `<table>` + custom CSS for fields, mappings, indexes, relationships |
| Use LG `Card` / `ExpandableCard` for content containers | ✗ | Custom `.metaCard`, `.bqCard`, `.relCard`, `.footerCard` divs |
| Use LG `SearchInput` for search | ✗ | Uses `TextInput`; should be `SearchInput` (skill explicitly lists it) |
| Use LG `Spinner` from `loading-indicator` | ✗ | Catalog loading shows raw `<Body>Loading…</Body>` |
| Use LG `Banner` for error states | ⚠ | `BianApiTab` already does this; the data-model side has no error path (data is bundled) |
| Use LG `Skeleton` for async content | ✗ | No skeletons during catalog fetch |
| Empty states: dashed border, `#FAFBFA`, reduced-opacity icon, centered | ✗ | Search-empty currently silently hides groups — no empty state |
| Sticky header with `zIndex: 100` | ✗ | Hero scrolls with content |
| Max-width container (1400px for data-heavy) | ✗ | Body fills viewport without max-width clamp |
| `:focus-visible` indicator on every interactive element | ✗ | Custom `<button>` for sidebar items has no focus style |
| Touch targets 44x44 on small screens | ⚠ | Sidebar buttons ~32px tall — fine on desktop, fails WCAG on mobile |
| Animations: CSS-only, 150/220ms, `cubic-bezier(0.33, 1, 0.68, 1)` | ⚠ | Currently `transition: background 0.1s` — should standardize |
| `prefers-reduced-motion` respected | ✗ | No media query |
| ARIA on custom widgets (sidebar list, tabs) | ⚠ | Sidebar has `aria-label="BIAN domains"` but list items lack semantics; LG `Tabs` handles tabs |
| Emoji policy: never in nav / headers / badges | ✗ | Sidebar items use 👤🏦💸… as domain icons; chart-of-accounts hero uses 📒. **This conflicts with the user's "data EXACTLY the same" requirement** — see Open Question 1 |
| Heading font Euclid Circular A | ✓ | LG typography components use it |
| Code font Source Code Pro | ✓ | Used throughout |

**Stack note:** `@leafygreen-ui/palette` is in `package.json`. `@leafygreen-ui/tokens` is **not** declared as a direct dependency — needs adding (it's a transitive dep, but explicit is required for direct import).

---

## 2. Open questions (resolve before Phase 2)

1. **Emoji icons in sidebar.** The HTML data ships with emoji icons per domain (👤 customers, 🏦 accounts, 💸 payments, …). Skill rule: **no emojis in core navigation**. Options:
   - **A.** Drop emojis. Replace with LG `Icon` glyphs mapped per domain (e.g. `Person`, `University`, `CreditCard`).
   - **B.** Keep emojis (user said "data EXACTLY the same"). Document the deviation from skill in this plan.
   - **Recommendation:** A. The emoji is decoration, not data — replacing it with LG icons preserves the information architecture and brings the page in line with skill rules. Confirm with user.

2. **Hero color.** Current `#001E2B` (green.dark3) vs skill-prescribed `palette.green.dark2` (`#023430`). The HTML used the darker shade. Options:
   - **A.** Follow skill — switch to `green.dark2`.
   - **B.** Keep darker shade per HTML.
   - **Recommendation:** A.

3. **Sticky hero or static hero?** Skill says headers should be sticky. The hero here is content-rich (title + 5 stats + CTA + back button). A sticky condensed bar after scroll would be cleaner.
   - **Recommendation:** Two-tier — full hero on entry, condensed sticky strip on scroll.

---

## 3. Phased migration

### Phase 0 — Foundations (small, low-risk)

Land before any visual changes. Independently shippable.

- Add `@leafygreen-ui/tokens` to `package.json` as a direct dependency.
- Create `frontend/lib/ui/tokens.js` exporting a `uiTokens` object — surfaces, borders, shadows, transitions — wrapping `palette` and `spacing` per the skill's pattern. This is the single source of truth for non-component design values.
- Document in the file's header comment which `palette.*` token each value comes from.

**Out:** new file `lib/ui/tokens.js`, updated `package.json`. **Risk:** none.

---

### Phase 1 — Hex → tokens (no visual change)

Replace every raw hex literal in `BianDataModelPage.jsx`/`.module.css` with the matching `palette.*` / `uiTokens.*` value. CSS module hexes get a `/* palette.gray.light2 */` comment per skill rule for CSS-modules.

- All inline `style={{ color: '#XXXXXX' }}` → `style={{ color: palette.green.base }}` etc.
- All `padding: 18px` → `padding: spacing[400]`-style references where in JSX; CSS module keeps px values but gains comments mapping to tokens.
- `Badge` inline-style overrides for `pattern` (currently `style={{ background: patColor + '20' }}`) → switch to LG `Badge` semantic variants where possible (`green` / `blue` / `yellow` / `red` / `purple`) keyed by `pattern`.

**Risk:** low. Same pixels, same colors. Diff is mechanical.

---

### Phase 2 — Replace custom containers with LG primitives

Swap hand-rolled card divs and tables for LG components.

- `<div className={styles.metaCard}>` (collection metadata) → `<Card>` with `<Body>` rows.
- `<div className={styles.domainHeader}>` → `<Card>` with custom accent border via inline `borderTop` (only allowed deviation since LG `Card` lacks accent slot).
- `<div className={styles.bqCard}>` → `<ExpandableCard>` per BQ — fits the disclosure pattern, supports very long BQ field lists without the page exploding.
- `<div className={styles.relCard}>` → `<Card>` with semantic Badge for cardinality.
- `<div className={styles.footerCard}>` (pattern legend, DB map) → `<Card>`.
- All `<table className={styles.tbl}>` → LG `Table` / `TableHead` / `HeaderRow` / `HeaderCell` / `TableBody` / `Row` / `Cell` per skill component decision table.

**Risk:** medium. LG `Table` has a fixed visual signature; current density is higher than LG default. May need to accept LG's spacing or use `Table` with `shouldAlternateRowColor={false}` and zoom to data-dense vertical.

---

### Phase 3 — Sidebar refactor

Currently a stack of plain `<button>` elements. Make it accessible and LG-coherent.

- Wrap sidebar in a `<nav aria-label="BIAN domains">` (already done) with `<ul role="list">`.
- Each domain becomes an `<li><button role="tab"…>` or — better — switch to LG `SegmentedControl` / `RadioBoxGroup` if the count fits, but here we have 16 items → too many for segmented.
- Keep custom buttons but apply skill-mandated focus-visible style: `box-shadow: 0 0 0 2px ${palette.blue.light2}` on `:focus-visible`.
- Switch `TextInput` to `SearchInput` from `@leafygreen-ui/search-input`.
- Replace emoji icons (Open Q 1A): map each domain key to an `<Icon glyph="…" />` from LG. Drop the `icon` field's literal emoji.
- Add empty state when search returns zero domains: dashed border card, "No domains match" + clear-search action.

**Risk:** medium. Visual change is visible — sidebar will read differently without emoji color.

---

### Phase 4 — Loading / error / empty states for Semantic API

`BianApiTab` already wires these via props but the wrappers aren't LG-styled.

- Loading: replace `<Body>Loading BIAN API catalog…</Body>` with `<Spinner />` (from `loading-indicator`) + `ParagraphSkeleton` from `skeleton-loader`.
- Error: confirm `Banner variant="danger"` is used (already is) — add a retry button via LG `Button`.
- Empty (catalog has zero services): dashed card with icon + helpful message.

**Risk:** low.

---

### Phase 5 — Layout & responsive

- Wrap `<main>` content in a max-width container: 1400px for the data-heavy domain views (collection + mapping + BQ tabs all benefit from horizontal room).
- Make hero sticky-on-scroll: full hero collapses to a condensed strip (just back button + title + CTA) when user scrolls past 80px. CSS-only via `position: sticky; top: 0` on a wrapper, plus `IntersectionObserver` to toggle a `condensed` class. **No JS animations** per skill — pure CSS transition `cubic-bezier(0.33, 1, 0.68, 1)` 220ms.
- Breakpoints: 1024px → sidebar collapses to a `<Drawer>` (LG `@leafygreen-ui/drawer` is already a dep). Below 768px the hero stats wrap fully.
- Honor `@media (prefers-reduced-motion: reduce)` — disable hero collapse transition, instant snap.

**Risk:** medium. Sticky-on-scroll is the visible change most likely to need iteration.

---

### Phase 6 — Accessibility hardening

- Audit body text on white surfaces: any `#5C6C75` (`palette.gray.dark1` is `#5D6C74` — close, verify) gets confirmed at ≥ 4.5:1 vs `#FFFFFF`. Lighter neutrals (`#889397`) are reserved for non-essential meta only (badge labels, separator text).
- Every interactive element gets a `:focus-visible` shadow.
- Tab content regions get `role="tabpanel"` (LG `Tabs` handles this — verify).
- `Spinner` and async regions get `aria-live="polite"`.
- Pattern badges convey severity-like meaning — add `aria-label` like `"Pattern: Management"`.
- Test with keyboard-only nav: tab order must traverse hero → back → search → sidebar → tabs → table.

**Risk:** low–medium. Some test/iterate.

---

### Phase 7 — Polish

- Card hover: `translateY(-2px)` + `uiTokens.shadowHover` on relationship cards and BQ cards. `onMouseEnter` / `onMouseLeave` per skill (cannot use CSS-only because token shadow values come from JS; or use CSS module with documented hex fallbacks).
- Standardize transitions: 150ms (snappy) for hover, 220ms (medium) for layout.
- Run the "Design Completion Checklist" from the skill end-to-end.

**Risk:** low.

---

## 4. Concrete deliverables per phase

| Phase | Files touched | New files | Lines (rough) |
|---|---|---|---|
| 0 | `package.json` | `lib/ui/tokens.js` | ~80 |
| 1 | `BianDataModelPage.jsx`, `.module.css` | — | ~150 (mechanical) |
| 2 | `BianDataModelPage.jsx`, `.module.css` | — | ~250 |
| 3 | `BianDataModelPage.jsx`, `.module.css`, `bianDataModelData.js` (icon mapping) | `lib/ui/domainIconMap.js` | ~120 |
| 4 | `BianDataModelPage.jsx` | — | ~40 |
| 5 | `BianDataModelPage.jsx`, `.module.css` | — | ~100 |
| 6 | `BianDataModelPage.jsx`, `.module.css` | — | ~60 |
| 7 | `BianDataModelPage.jsx`, `.module.css` | — | ~40 |

Total ~900 lines across 8 commits. Each commit independently buildable & shippable.

---

## 5. What I will NOT change

- **Data**: every domain, field, BQ, mapping, relationship stays bit-identical to the alias map. The skill governs visual presentation only.
- **Information architecture**: sidebar groups, tab structure, hero stats remain.
- **Routing**: `/bian-data-model` and `/ledger-flow` stay where they are.
- **Existing `BianApiTab`**: presentational component is untouched. Only its wrapper (`SemanticApiView`) gets LG-compliant chrome.

---

## 6. Suggested sequencing

Land Phases 0–1 first (zero visual change, foundation only). Pause for review. Then Phases 2–4 in one batch (visible refactor of containers + tables + states). Pause again. Then Phases 5–7 (layout + a11y + polish).

Total estimated work: ~3–4 working sessions of focused implementation, paced for review checkpoints.
