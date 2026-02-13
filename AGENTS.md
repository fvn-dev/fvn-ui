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
```

## Full Documentation

For complete API reference, examples, and patterns, read:
- **LLM.md** — Full component documentation in this package
- **README.md** — Installation and usage overview
