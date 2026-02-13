# fvn-ui — LLM Reference

A minimalist vanilla JS component library. No framework, no build complexity. Use existing CSS utility classes — avoid creating new CSS.

## Philosophy

1. **Use existing classes** — The library provides extensive utility classes. Compose with them.
2. **Props become classes** — Shorthand props like `padding: 4` become `pad-4` classes automatically.
3. **Flexible arguments** — Components accept args in any order: `(parent, config)` or `(config)` or `('text', config)`.
4. **Return DOM elements** — All components return native HTMLElements with added methods.

---

## Import Styles

```js
// Individual imports (tree-shakeable)
import { button, card, layout } from 'fvn-ui'

// Namespaced import (cleaner DX, avoids reserved words)
import { ui } from 'fvn-ui'

ui.button({ label: 'Save' })
ui.switch({ label: 'Dark mode' })  // vs switchComponent
ui.select({ options: [...] })       // vs selectComponent
```

---

## Core: `el(tag, config)`

Creates DOM elements. The foundation of everything.

```js
el('div', { class: 'flex gap-2', text: 'Hello' })
el('button', { onClick: handler, disabled: true })
el('<h1>HTML string</h1>')  // Parse HTML
```

**Config options:**
- `class` — string | array | object (truthy keys become classes)
- `text` — safe textContent
- `html` — innerHTML (trusted only)
- `children` — array of elements/strings to append
- `data` — object for data-* attributes
- `style` — object for inline styles
- `on[Event]` — event handlers (onClick, onInput, etc.)
- `ref` — callback with element: `ref: (el) => myRef = el`

---

## Layout: `layout.row()` / `layout.col()`

Flexbox containers with sensible defaults.

```js
layout.row([child1, child2])                       // horizontal, gap-2
layout.row({ gap: 4, children: [child1, child2] }) // children as prop
layout.col({ justify: 'between' }, [...])          // children as separate arg
```

**Props:** `gap`, `align`, `justify`, `padding`, `width`, `flex`, `children`

---

## Shorthand Props → Classes

These props are automatically converted to utility classes:

| Prop | Class | Example |
|------|-------|---------|
| `padding: 4` | `pad-4` | 4-unit padding |
| `gap: 2` | `gap-2` | 2-unit gap |
| `width: 'full'` | `w-full` | full width |
| `border: true` | `border` | standard border |
| `shade: true` | `shade` | shaded background |
| `small: true` | `small` | small text |
| `muted: true` | `muted` | muted text color |
| `flex: 1` | `flex-1` | flex-grow: 1 |

Use `props: false` to disable defaults (e.g., `border: false` on card).

---

## Components

### `button({ label, variant, color, icon, shape })`

```js
button({ label: 'Save', variant: 'primary' })
button({ label: 'Delete', color: 'red', icon: 'trash' })
button({ icon: 'settings', variant: 'ghost', shape: 'round' })
```

| Prop | Values |
|------|--------|
| `label` / `text` | Button text |
| `variant` | `'default'` `'primary'` `'secondary'` `'outline'` `'ghost'` `'minimal'` |
| `color` | `'primary'` `'red'` `'green'` `'blue'` `'pink'` `'yellow'` `'orange'` |
| `shape` | `'round'` |
| `icon` | Icon name from svg.js |
| `size` | `'small'` `'medium'` `'large'` |
| `disabled` | boolean |

**Methods:** `btn.toggleLoading('Loading...')`, `btn.setLabel('Done', 3000)`

---

### `card({ title, description, content })`

```js
card({ title: 'Settings', description: 'Configure your app', content: [...] })
card({ title: 'Note', content: 'Plain text content', border: false })
```

| Prop | Description |
|------|-------------|
| `title` | Card header title |
| `description` | Subtitle text |
| `content` | string, element, array, or function |
| `border` | `false` to remove border (default: true) |
| `padding` | Override default padding |

---

### `input({ label, placeholder, onSubmit, rows })`

```js
input({ label: 'Email', placeholder: 'you@example.com' })
input({ label: 'Search', onSubmit: (value) => search(value) })
input({ label: 'Bio', rows: 4, placeholder: 'Tell us about yourself...' })
```

| Prop | Description |
|------|-------------|
| `label` | Input label |
| `placeholder` | Placeholder text |
| `value` | Initial value |
| `size` | `'default'` `'large'` |
| `rows` | If set, renders a `<textarea>` with this many rows |
| `onSubmit` | Called on Enter key (input only, not textarea) |

---

### `switchComponent({ label, checked, color, onChange })`

```js
switchComponent({ label: 'Dark mode', checked: true })
switchComponent({ label: 'Notifications', color: 'primary', onChange: (v) => save(v) })
```

---

### `checkbox({ label, checked, color, onChange })`

```js
checkbox({ label: 'Accept terms', checked: false })
checkbox({ label: 'Premium', color: 'blue', checked: true })
```

---

### `radio({ items, value, color, onChange })`

```js
radio({
  value: 'apple',
  items: [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' }
  ]
})
```

---

### `selectComponent({ options, value, placeholder, onChange })`

```js
selectComponent({
  label: 'Country',
  placeholder: 'Select...',
  options: [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' }
  ]
})
```

---

### `tabs({ items, variant, active })`

```js
tabs({
  variant: 'outline',
  items: [
    { label: 'Tab 1', render: () => content1 },
    { label: 'Tab 2', render: () => content2 }
  ]
})
```

| Prop | Values |
|------|--------|
| `variant` | `'default'` `'outline'` `'border'` `'minimal'` `'ghost'` |
| `active` | Index of initially active tab |
| `color` | Tab color |
| `shape` | `'round'` |

---

### `dialog({ content, variant })` / `modal()` / `tooltip()`

```js
// Programmatic modal
modal({ open: clickEvent, content: card({ title: 'Confirm' }) })

// Hover tooltip
tooltip({ open: mouseEvent, content: 'Tooltip text', inverted: true })

// Pre-built confirm dialog
confirm({
  label: 'Delete',
  title: 'Are you sure?',
  description: 'This cannot be undone',
  confirm: 'Delete',
  cancel: 'Cancel',
  onConfirm: () => handleDelete()
})
```

| Prop | Description |
|------|-------------|
| `open` / `toggled` | Event or element to trigger |
| `content` | Dialog content |
| `variant` / `type` | `'modal'` `'tooltip'` |
| `position` | `'top'` `'bottom'` `'left'` `'right'` |
| `inverted` | Dark background |

---

### `avatar({ name, src, description, color, size, variant })`

```js
avatar({ name: 'John Doe', description: 'Admin', color: 'blue' })
avatar({ src: 'photo.jpg', name: 'Jane', size: 'large', variant: 'square' })
```

---

### `collapsible({ label, content, open })`

```js
collapsible({
  label: 'Advanced Settings',
  content: card({ title: 'Settings' })
})
```

---

### `label(text, { small, muted })`

```js
label('Section Title')
label('Helper text', { small: true, muted: true })
```

---

### `image({ src, alt, lazy })`

```js
image({ src: 'photo.jpg', alt: 'Description' })  // lazy-loads by default
```

---

## Available Utility Classes

### Layout
`flex`, `flex-col`, `flex-1`, `gap-{1-10}`, `align-{start|center|end|stretch}`, `justify-{start|center|end|between}`

### Spacing
`pad-{1-10}`, `margin-{1-10}`, `block-{1-10}`, `inline-{1-10}`

### Width
`w-full`, `w-auto`, `w-{1-10}`

### Text
`small`, `muted`, `bold`

### Visual
`border`, `border-{color}`, `shade`, `rounded`

---

## Colors

Available color tokens: `primary`, `red`, `green`, `blue`, `pink`, `yellow`, `orange`

Use with `color` prop on components, or as CSS variables: `var(--primary)`, `var(--red)`, etc.

---

## Best Practices for LLMs

1. **Don't create new CSS** — Use utility classes and component props
2. **Use layout helpers** — `layout.row([...])` and `layout.col([...])` for structure
3. **Compose components** — Nest cards, buttons, inputs as children
4. **Use shorthand props** — `padding: 4` not `class: 'pad-4'`
5. **Return from render functions** — Tab/collapsible content uses `render: () => element`
6. **Handle events** — Use `onClick`, `onChange`, `onSubmit` props
