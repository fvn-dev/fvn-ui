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

## Event Callbacks

All callbacks use consistent `(value, ...context, event)` signature:

```js
// First arg = unwrapped value, last arg = event
ui.input({ onInput: (val, e) => console.log(val) })
ui.checkbox({ onChange: (checked, e) => ... })
ui.switch({ onChange: (checked, e) => ... })
ui.radio({ onChange: (value, item, e) => ... })
ui.select({ onChange: (value, item, e) => ... })
ui.tabs({ onChange: (value, item, e) => ... })

// `this` = element
ui.input({ onChange(val) { this.dataset.saved = val } })
```

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
| Validated input | `ui.input({ label, validate: 'email' })` |
| Action | `ui.button({ label, onClick })` |

## Layout Pattern

```js
ui.card({
  title: 'Form',
  content: ui.col({ gap: 4 }, [
    ui.input({ label: 'Field 1' }),
    ui.input({ label: 'Field 2' }),
    ui.row({ gap: 2 }, [
      ui.button({ label: 'Cancel', variant: 'ghost' }),
      ui.button({ label: 'Save', variant: 'primary', end: true })
    ])
  ])
})

// Inputs in a row (rows grow by default now)
ui.row([  
  ui.input({ label: 'First' }),
  ui.input({ label: 'Last' })
])

// Vertically center content in a column
ui.col({ center: true }, [
  ui.avatar({ name: 'John' })
])
```

## Input Validation

```js
// Built-in validators: 'email', 'url', 'phone'
ui.input({ label: 'Email', validate: 'email', message: 'Invalid email' })

// With counter and limits
ui.input({ label: 'Bio', rows: 4, min: 10, max: 500, counter: true })

// Manual validation (form validation)
const field = ui.input({ label: 'Name' })
field.error('Required')  // mark invalid with message
field.ok()               // clear error
```

## Layout Shorthands

| Prop | Effect |
|------|--------|
| `center: true` | Center on main axis |
| `start: true` | Align start (left for row, top for col) |
| `end: true` | Align end (right for row, bottom for col) |
| `grow: false` | Shrink to content (default is grow) |

**Child props:**

| Prop | Effect |
|------|--------|
| `end: true` | Push to end (right in row, bottom in col) |
| `start: true` | Push to start |
| `self: 'start'` | Align self: `'start'`, `'center'`, `'end'` |

## CSS Variables

Common variables for custom styling (see `style.css` for full list):

| Variable | Description |
|----------|-------------|
| `--space-1` to `--space-10` | Spacing scale (gap, padding) |
| `--back`, `--text`, `--muted` | Background, text, muted colors |
| `--hover`, `--border` | Hover and border colors |
| `--radius` | Common border radius |

## Custom Icons

Extend with icons from [Lucide](https://lucide.dev/icons) or [Feather](https://feathericons.com):

```js
// Add icons using SVG inner content (no <svg> wrapper)
ui.svg.extend({
  github: '<path d="M15 22v-4a4.8..."/>',
  custom: '<circle cx="12" cy="12" r="10"/>'
})

ui.button({ icon: 'github' })  // Now works
ui.svg.list()                   // Get all icon names
```

## Full Documentation

For complete API reference, examples, and patterns, read:
- **LLM.md** — Full component documentation in this package
- **README.md** — Installation and usage overview
