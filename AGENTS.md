# fvn-ui — AI Agent Instructions

> **For AI assistants**: This file contains instructions for working with fvn-ui.
> See `LLM.md` in this package for complete API documentation and examples.

## Quick Start

```js
import { ui } from 'fvn-ui'

// All components available via ui namespace
ui.button({ label: 'Click me', variant: 'primary' })
ui.input({ label: 'Name', placeholder: 'Enter name...' })
ui.switch({ label: 'Enable feature' })
ui.card({ title: 'Card', content: [...] })
```

## Critical Rules

1. **Always use `ui.` namespace** — Import `{ ui }` not individual components
2. **Labels on all inputs** — Every input/select needs a `label` prop
3. **Use layout helpers** — `ui.row()` and `ui.col()` for structure
4. **One primary button** — Only one `variant: 'primary'` per view
5. **Switch for booleans** — Use `ui.switch()` not checkbox for on/off settings
6. **Placeholder not value** — Use `placeholder` for hints, not `value`
7. **Zero custom CSS** — fvn-ui provides complete styling (see below)

## ⚠️ Styling Philosophy — CRITICAL

**fvn-ui provides complete styling. Do NOT add custom CSS unless absolutely necessary.**

### When Custom CSS is Needed
- Drag-and-drop visual states (`.dragging`, `.drag-over`)
- Custom interactive behaviors not in fvn-ui
- App-level layout constraints (e.g., `max-width` on dashboard)

### When Custom CSS is NOT Needed
- Backgrounds, borders, shadows → use `ui.card()` or `border` prop
- Spacing/gaps → use `gap` prop on `row()`/`col()`
- Centering → use `center: true` prop
- Full-width elements → use `grow: true` prop
- Padding → use `padding` prop
- Hover/focus states → fvn-ui components include these
- Dark mode → fvn-ui handles automatically

### Anti-Patterns

❌ **Wrong — CSS for layout:**
```css
.my-container { display: flex; justify-content: center; }
```
```js
ui.el('div', { class: 'my-container' }, [...])
```

✅ **Correct — Use layout props:**
```js
ui.col({ center: true }, [...])
```

❌ **Wrong — CSS for backgrounds/borders:**
```css
.toolbar { background: #f9fafb; border: 1px solid #e5e7eb; }
```

✅ **Correct — Use card or clean layout:**
```js
ui.row({ gap: 2 }, [...])  // Clean, no background needed
ui.card({ content: [...] })  // When you need a bordered container
```

### Minimal CSS Template

```css
/* Only add what fvn-ui cannot do */
.ui-dashboard { max-width: 1000px; margin: 0 auto; }

/* Custom interactive states */
.draggable.dragging { opacity: 0.5; }
.draggable.drag-over { border-style: dashed; }
```

## Component Selection

| Need | Use |
|------|-----|
| On/off setting | `ui.switch({ label })` |
| Agreement/terms | `ui.checkbox({ label })` |
| 2-5 options | `ui.radio({ items: [...] })` |
| 6+ options | `ui.select({ options: [...] })` |
| Short text | `ui.input({ label })` |
| Long text | `ui.input({ label, rows: 4 })` |
| Action | `ui.button({ label, onClick })` |

## Layout Pattern

```js
ui.card({
  title: 'Form',
  content: ui.col({ gap: 4 }, [
    ui.input({ label: 'Field 1' }),
    ui.input({ label: 'Field 2' }),
    ui.row({ gap: 2, justify: 'end' }, [
      ui.button({ label: 'Cancel', variant: 'ghost' }),
      ui.button({ label: 'Save', variant: 'primary' })
    ])
  ])
})

// Inputs in a row (grow: true makes row stretch to full width)
ui.row({ grow: true }, [
  ui.input({ label: 'First' }),
  ui.input({ label: 'Last' })
])

// Vertically center content in a column
ui.col({ center: true }, [
  ui.avatar({ name: 'John' })
])
```

## Layout Shorthands

| Prop | Effect |
|------|--------|
| `grow: true` | Stretch to fill available space |
| `center: true` | Center content (justify for col, align for row) |
| `distribute: 'equal'` | Children share space equally |

## Full Documentation

For complete API reference, examples, and patterns, read:
- **LLM.md** — Full component documentation in this package
- **README.md** — Installation and usage overview
