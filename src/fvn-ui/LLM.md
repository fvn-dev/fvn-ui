# fvn-ui — LLM Reference

A minimalist vanilla JS component library. No framework, no build complexity.

## IMPORTANT: Callback Signature Pattern

All event callbacks follow a consistent `(value, ...context, event)` pattern:

```js
// First arg is always the unwrapped value, last arg is always the event
input({ onInput: (value, event) => console.log(value) })
input({ onChange: (value, event) => console.log(value) })
checkbox({ onChange: (checked, event) => console.log(checked) })
switchComponent({ onChange: (checked, event) => console.log(checked) })
radio({ onChange: (value, item, event) => console.log(value, item) })
selectComponent({ onChange: (value, item, event) => console.log(value, item) })
tabs({ onChange: (value, item, event) => console.log(value, item) })
collapsible({ onChange: (isOpen, event) => console.log(isOpen) })
toggle({ onChange: (checked, event) => console.log(checked) })
editable({ onInput: (html, event) => console.log(html, event.target.textContent) })

// `this` is bound to the element
input({ onInput(value) { console.log(this.id, value) } })
```

**Special case - draggable uses object payload:**
```js
// draggable - passes reorder info (no event)
draggable({ onChange: ({ items, from, to }) => ... })
```

---

## IMPORTANT: Native HTML Props Pass Through

All components accept standard HTML attributes which are passed to the underlying element:

```js
// Input with HTML5 validation
input({ type: 'number', min: 0, max: 100, step: 5, required: true })
input({ type: 'email', pattern: '[a-z]+@.+', autocomplete: 'email' })

// Button with native attributes
button({ label: 'Submit', type: 'submit', disabled: isLoading })

// Any element
el('div', { id: 'my-id', tabindex: 0, 'aria-label': 'Label' })
```

---

## Component Selection Guide

**Choose the RIGHT component for the use case:**

| User Need | Component | NOT |
|-----------|-----------|-----|
| On/off toggle setting | `switchComponent` | ~~input~~ |
| Yes/no confirmation | `checkbox` | ~~input~~ |
| One choice from few options | `radio` | ~~select~~ |
| One choice from many options | `selectComponent` | ~~radio~~ |
| Short text entry | `input` | ~~textarea~~ |
| Long text entry | `input({ rows: 4 })` | separate textarea |
| Number with constraints | `input({ type: 'number', min, max })` | text input |
| Click action | `button` | ~~link~~ |
| Navigation | `<a>` via `el('a', {...})` | ~~button~~ |

**Boolean inputs comparison:**

```js
// Switch: settings, preferences, on/off states
switchComponent({ label: 'Enable notifications', onChange: save })

// Checkbox: agreement, multiple selections
checkbox({ label: 'I accept the terms', required: true })

// Toggle: binary choice with labels
toggle({ options: ['Monthly', 'Yearly'], onChange: setPlan })
```

---

## Layout & UX Best Practices

### Good Layout Patterns

```js
// Form with proper spacing
layout.col({ gap: 4, width: 'full' }, [
  input({ label: 'Name', placeholder: 'Enter your name' }),
  input({ label: 'Email', type: 'email', placeholder: 'you@example.com' }),
  layout.row({ gap: 2, justify: 'end' }, [
    button({ label: 'Cancel', variant: 'ghost' }),
    button({ label: 'Save', variant: 'primary' })
  ])
])

// Card with content sections
card({
  title: 'Settings',
  description: 'Configure your preferences',
  content: layout.col({ gap: 4 }, [
    switchComponent({ label: 'Dark mode' }),
    switchComponent({ label: 'Notifications' }),
  ])
})

// Horizontal form row
layout.row({ gap: 4, align: 'end' }, [
  input({ label: 'Search', placeholder: 'Query...', flex: 1 }),
  button({ label: 'Search', icon: 'search', variant: 'primary' })
])
```

### UX Guidelines

1. **Use `placeholder` for hints, NOT values** — placeholder disappears on focus
2. **Use `value` for pre-filled data** — value persists until user changes it
3. **Group related inputs** — use `layout.col({ gap: 4 })` for form sections
4. **Align buttons right** — use `justify: 'end'` for action buttons
5. **Primary action = primary variant** — one primary button per form
6. **Use labels consistently** — all form inputs should have labels
7. **Provide feedback** — use `btn.toggleLoading()` during async actions

### Spacing Scale

| Gap | Use Case |
|-----|----------|
| `gap: 2` | Tight grouping (buttons, chips) |
| `gap: 3` | Related items (checkboxes) |
| `gap: 4` | Form fields |
| `gap: 6` | Sections within a card |
| `gap: 8` | Major sections |

---

## Common Mistakes

❌ **Wrong:**
```js
// Using input for boolean
input({ label: 'Enable feature', type: 'checkbox' })

// Value instead of placeholder
input({ label: 'Email', value: 'Enter email' })

// No labels
input({ placeholder: 'Name' })
input({ placeholder: 'Email' })

// Flat layout, no structure
button({ label: 'A' })
button({ label: 'B' })
input({ label: 'X' })
```

✅ **Correct:**
```js
// Boolean → switch
switchComponent({ label: 'Enable feature', onChange: handler })

// Placeholder for hints, value for data
input({ label: 'Email', placeholder: 'you@example.com' })
input({ label: 'Email', value: user.email })  // pre-filled

// Always use labels
input({ label: 'Name', placeholder: 'Enter your name' })
input({ label: 'Email', placeholder: 'you@example.com' })

// Use layout helpers
layout.col({ gap: 4 }, [
  layout.row({ gap: 2 }, [
    button({ label: 'A' }),
    button({ label: 'B' })
  ]),
  input({ label: 'X' })
])
```

---

## Import Styles

```js
// Namespaced import (recommended)
import { ui } from 'fvn-ui'

ui.button({ label: 'Save' })
ui.switch({ label: 'Dark mode' })  // alias for switchComponent
ui.select({ options: [...] })       // alias for selectComponent
ui.el('div', { ... })
ui.row([...])
ui.col([...])

// Individual imports
import { button, card, input, layout, el } from 'fvn-ui'
```

---

## Core: `el(tag, config)`

Creates DOM elements. All native HTML attributes pass through.

```js
el('div', { class: 'flex gap-2', text: 'Hello' })
el('button', { onClick: handler, disabled: true, type: 'submit' })
el('input', { type: 'range', min: 0, max: 100, step: 10 })
el('<h1>HTML string</h1>')  // Parse HTML
```

**Config options:**
- `class` — string | array of classes
- `text` — safe textContent
- `html` — innerHTML (trusted only)
- `children` — array of elements to append
- `style` — object for inline styles
- `on[Event]` — event handlers (onClick, onInput, etc.)
- `ref` — callback: `ref: (el) => myRef = el`
- **Any HTML attribute** — id, disabled, type, min, max, required, etc.

---

## Layout: `layout.row()` / `layout.col()`

Flexbox containers. **Grow by default** to fill parent. Args can be in any order.

```js
layout.row([child1, child2])                       // horizontal, grows to fill
layout.row({ gap: 4, children: [child1, child2] }) // explicit gap
layout.col({ gap: 4, justify: 'between' }, [...])  // children as arg
layout.row({ grow: false }, [...])                 // opt-out: shrink to content

// Alignment shorthands
layout.row({ center: true }, [...])   // horizontally centered
layout.row({ end: true }, [...])      // aligned right
layout.col({ center: true }, [...])   // vertically centered
layout.col({ end: true }, [...])      // aligned bottom

// Push child to end (works in both row and col)
layout.row([
  button({ label: 'Left' }),
  button({ label: 'Right', end: true })  // pushed to end
])

// Section: col with vertical padding (for page sections)
layout.section([...])                    // default block-4 padding
layout.section({ block: 6 }, [...])      // custom padding
```

**Container props:**

| Prop | Description |
|------|-------------|
| `gap: 4` | Gap between children (0-10, maps to --space-N) |
| `justify` | Main axis: `start`, `center`, `end`, `between`, `around`, `evenly` |
| `align` | Cross axis: `start`, `center`, `end`, `stretch` |
| `center: true` | Center content on main axis |
| `start: true` | Align content to start |
| `end: true` | Align content to end |
| `grow: false` | Opt-out: shrink to content instead of fill |
| `distribute: 'equal'` | Children share space equally (flex: 1) |
| `wrap: true` | Allow flex wrapping |

**Child props:**

| Prop | Description |
|------|-------------|
| `end: true` | Push to end of parent (right in row, bottom in col) |
| `start: true` | Push to start of parent |
| `self: 'start'` | Align self: `'start'`, `'center'`, `'end'`, `'stretch'` |

---

## Shorthand Props → Classes

| Prop | Class | Example |
|------|-------|---------|
| `padding: 4` | `pad-4` | 4-unit padding |
| `gap: 2` | `gap-2` | 2-unit gap |
| `width: 'full'` | `w-full` | full width |
| `flex: 1` | `flex-1` | flex-grow: 1 |
| `border: true` | `ui-border` | standard border |
| `shade: true` | `shade` | shaded background |
| `small: true` | `small` | small text |
| `muted: true` | `muted` | muted text color |

---

## CSS Variables

Common variables for custom styling. See `style.css` for full list.

| Variable | Description |
|----------|-------------|
| `--space-1` to `--space-10` | Spacing scale (used by gap, padding props) |
| `--back` | Background color |
| `--text` | Text color |
| `--muted` | Muted/secondary text |
| `--hover` | Hover state background |
| `--border` | Border color |
| `--radius` | Common border radius |

---

## Components

### `button({ label, variant, color, icon })`

```js
button({ label: 'Save', variant: 'primary' })
button({ label: 'Delete', color: 'red', variant: 'outline' })
button({ icon: 'settings', variant: 'ghost' })
button({ label: 'Submit', type: 'submit', disabled: isLoading })
```

| Prop | Values |
|------|--------|
| `label` | Button text |
| `variant` | `'default'` `'primary'` `'secondary'` `'outline'` `'ghost'` `'minimal'` |
| `color` | `'primary'` `'red'` `'green'` `'blue'` `'pink'` `'yellow'` `'orange'` |
| `shape` | `'round'` |
| `icon` | Icon name (see icons section) |
| `disabled` | boolean |

**Methods:** `btn.toggleLoading('Saving...')`, `btn.setLabel('Saved!', 2000)`

---

### `card({ title, description, content })`

```js
card({ title: 'Settings', description: 'Configure app' })
card({ 
  title: 'Form',
  content: layout.col({ gap: 4 }, [
    input({ label: 'Name' }),
    button({ label: 'Save', variant: 'primary' })
  ])
})
```

| Prop | Description |
|------|-------------|
| `title` | Card header |
| `description` | Subtitle |
| `content` | Element, array, or render function |
| `border` | `false` to remove (default: true) |
| `padding` | Override padding |

---

### `input({ label, placeholder, type, rows })`

Text input OR textarea. **All HTML input attributes work.**

```js
// Basic
input({ label: 'Name', placeholder: 'Enter name' })

// With HTML5 validation
input({ label: 'Email', type: 'email', required: true })
input({ label: 'Age', type: 'number', min: 18, max: 120 })
input({ label: 'Code', pattern: '[A-Z]{3}', maxlength: 3 })

// With submit handler (shows enter button)
input({ label: 'Search', onSubmit: (value) => search(value) })

// Textarea (use rows prop)
input({ label: 'Bio', rows: 4, placeholder: 'Tell us about yourself' })
```

| Prop | Description |
|------|-------------|
| `label` | Input label (always include!) |
| `placeholder` | Hint text (NOT default value) |
| `value` | Pre-filled value |
| `type` | `'text'` `'email'` `'password'` `'number'` `'tel'` `'url'` etc. |
| `rows` | If set, renders `<textarea>` |
| `onSubmit` | Called on Enter (input only) |
| `min/max/step` | For number inputs |
| `pattern/required/maxlength` | HTML5 validation |
| `required` | Require input to have a value (validates via `isValid()`) |
| `validate` | Built-in: `'email'`, `'url'`, `'phone'` or custom function |
| `min/max` | Character length limits (also colors counter) |
| `counter` | Show character counter (textarea) |
| `message` | Error message(s) — string or object |

**Validation examples:**

```js
// Required field
input({ label: 'Name', required: true })
input({ label: 'Name', required: true, message: { required: 'Name is required' } })

// Built-in validators
input({ label: 'Email', validate: 'email' })
input({ label: 'Website', validate: 'url' })
input({ label: 'Phone', validate: 'phone' })  // Norwegian format

// Custom validator function
input({ label: 'Code', validate: (v) => /^[A-Z]{3}$/.test(v) })

// With error messages
input({
  label: 'Email',
  validate: 'email',
  message: 'Please enter a valid email'  // shown on validation error
})

// Multiple message types
input({
  label: 'Bio',
  rows: 4,
  min: 10,
  max: 500,
  counter: true,
  message: {
    email: 'Invalid email',      // or use validator name
    min: 'At least {min} chars',
    max: 'Maximum {max} chars'
  }
})
```

**Methods:**

```js
const emailInput = input({ label: 'Email' })

// Manual validation control (for form validation)
emailInput.error('This field is required')  // mark invalid + show message
emailInput.ok()                              // clear error state

// Check validation state
emailInput.isValid()  // returns true/false

// Update length limits at runtime (revalidates + refreshes counter immediately)
emailInput.setLimits(5, 300)
emailInput.setLimits({ max: 120 }) // min unchanged
emailInput.setLimits({ min: null }) // clear min limit
```

`setLimits(...)` accepts `(min, max)` or `{ min, max }`.
`undefined` keeps existing bounds, `null` clears a bound.

---

### `switchComponent({ label, checked, onChange })`

**For: settings, preferences, on/off toggles**

```js
switchComponent({ label: 'Dark mode', checked: true, onChange: save })
switchComponent({ label: 'Notifications', color: 'primary' })
```

**Via ui namespace:** `ui.switch({ ... })`

---

### `checkbox({ label, checked, onChange })`

**For: agreements, multiple selections**

```js
checkbox({ label: 'Accept terms', required: true })
checkbox({ label: 'Subscribe to newsletter', checked: true })
```

---

### `toggle({ options, checked, onChange })`

**For: binary choice with visible labels**

```js
toggle({ options: ['Off', 'On'] })
toggle({ options: ['Monthly', 'Yearly'], checked: true, color: 'primary' })
```

---

### `radio({ items, value, onChange })`

**For: single selection from few options (< 6)**

```js
radio({
  label: 'Plan',
  value: 'pro',
  items: [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' }
  ],
  onChange: setPlan
})
```

---

### `selectComponent({ options, value, placeholder })`

**For: single/multi selection from many options**

```js
selectComponent({
  label: 'Country',
  placeholder: 'Select country...',
  options: [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    // ... many more
  ]
})

// Multi-select with filter
selectComponent({
  label: 'Tags',
  multiselect: true,
  filter: true,
  options: tagOptions
})

// Required validation
const country = selectComponent({
  label: 'Country',
  required: true,
  options: countries
})
country.isValid()  // false if nothing selected
```

| Prop | Description |
|------|-------------|
| `options` | Array of `{ value, label }` objects |
| `value` | Initially selected value(s) |
| `placeholder` | Placeholder text |
| `multiselect` | Allow multiple selections |
| `filter` | Show filter input |
| `required` | Require at least one selection |

**Methods:**

```js
const sel = selectComponent({ label: 'Country', required: true, options })
sel.isValid()     // returns true if has selection (when required)
sel.error()       // mark as invalid
sel.ok()          // clear invalid state
```

**Via ui namespace:** `ui.select({ ... })`

---

### `tabs({ items, variant })`

```js
tabs({
  variant: 'outline',
  items: [
    { label: 'General', render: () => generalSettings() },
    { label: 'Security', render: () => securitySettings() }
  ]
})
```

| Prop | Values |
|------|--------|
| `variant` | `'default'` `'outline'` `'border'` `'minimal'` `'ghost'` |
| `active` | Initial tab index |
| `color` | Tab color |

---

### `modal()` / `tooltip()` / `confirm()`

```js
// Modal dialog
const dlg = modal({ 
  content: card({ title: 'Edit Profile', content: form })
})
dlg.show()  // Open the dialog
dlg.hide()  // Close the dialog
dlg.toggle() // Toggle open/close

// Auto-open on event
modal({ open: clickEvent, content: card({ title: 'Edit' }) })

// Tooltip on hover
button({
  label: 'Info',
  onmouseenter: e => tooltip({ open: e, content: 'Help text' })
})

// Confirmation dialog
confirm({
  label: 'Delete',
  variant: 'outline',
  title: 'Are you sure?',
  description: 'This cannot be undone',
  confirm: 'Delete',
  confirmColor: 'red',
  cancel: 'Cancel',
  onConfirm: handleDelete
})
```

**Dialog instance methods:**
| Method | Description |
|--------|-------------|
| `show()` | Open the dialog |
| `hide()` | Close the dialog |
| `toggle()` | Toggle open/close |
| `setContent(content)` | Replace dialog content |
| `destroy()` | Close, remove from DOM |
| `isOpen` | Property: current state |

---

### `collapsible({ label, content })`

```js
collapsible({
  label: 'Advanced Settings',
  content: layout.col({ gap: 3 }, [
    switchComponent({ label: 'Debug mode' }),
    switchComponent({ label: 'Verbose logging' })
  ])
})
```

---

### `avatar({ name, src, description })`

```js
avatar({ name: 'John Doe', description: 'Admin', color: 'blue' })
avatar({ src: 'photo.jpg', name: 'Jane', size: 'large' })
```

| Prop | Values |
|------|--------|
| `size` | `'default'` `'medium'` `'large'` |
| `variant` | `'round'` `'square'` |
| `color` | Color for fallback |

---

### `image({ src, alt })`

```js
image({ src: 'photo.jpg', alt: 'Description' })
image({ src: 'photo.jpg', fallback: 'placeholder.jpg' })
```

| Prop | Description |
|------|-------------|
| `src` | Image URL |
| `alt` | Alt text |
| `fallback` | Fallback image URL on error |

---

### `draggable({ items, onChange })`

Sortable list with drag handles.

```js
const list = draggable({
  items: [
    el('div', { text: 'Item 1' }),
    el('div', { text: 'Item 2' }),
    el('div', { text: 'Item 3' })
  ],
  onChange: ({ items, from, to }) => console.log('Reordered:', from, '→', to)
})

// Methods
list.add(el('div', { text: 'New item' }))  // append
list.add(el('div', { text: 'At index' }), 0)  // insert at index
list.remove(0)  // remove by index
list.remove(element)  // remove by element
list.clear()  // remove all
list.reorder(fromIndex, toIndex)  // programmatic reorder
list.items  // get current items array
```

| Prop | Description |
|------|-------------|
| `items` | Initial items (elements or `{ content, id }`) |
| `icon` | Drag handle icon (default: `'grip'`) |
| `border` | Show borders (default: `true`) |
| `handlePosition` | `'left'` or `'right'` (default: `'right'`) |
| `index` | Show index numbers (default: `true`) |
| `onChange` | Called with `{ items, from, to }` after reorder |
| `onDragStart` | Called when drag starts |
| `onDragEnd` | Called when drag ends |

---

### `editable({ label, placeholder })`

Contenteditable element with input-like behavior. Rich mode is ProseMirror-backed with CommonMark markdown conversion.

```js
// Multiline (default)
editable({ placeholder: 'Type here...' })
editable({ label: 'Bio', rows: 5 })

// Single line with submit
editable({ label: 'Title', rows: 1, onSubmit: ({ value }) => save(value) })
editable({ multiline: false })  // same as rows: 1
```

| Prop | Description |
|------|-------------|
| `label` | Label text |
| `placeholder` | Placeholder (shown when empty) |
| `value` | Initial HTML content |
| `rows` | 1 = single line, >1 = sets min-height |
| `multiline` | `false` = single line mode |
| `rich` | Enable rich text toolbar (lazy-loads rich runtime) |
| `richInclude/richExclude` | Include/exclude toolbar actions (`heading`, `bold`, `italic`, `quote`, `list`, `link`, `clear`, `markdown`) |
| `plainText` | Strip formatting on paste |
| `required` | Require text content to be non-empty |
| `validate` | Built-in: `'email'`, `'url'`, `'phone'` or custom function |
| `min/max` | Character length limits |
| `message` | Error message(s) — string or object |
| `info` | Helper text shown when valid |
| `onInput` | Called with `(html, event)` in both rich and markdown modes |
| `onChange` | Called with `(html, event)` |
| `onSubmit` | Called on Enter (single line only) |

**Methods:**

```js
const ed = editable({ required: true, message: { required: 'Required' } })
ed.isValid()   // returns true/false
ed.error('Custom error')
ed.ok()
ed.reset()

// Convert content
ed.toMarkdown()
ed.fromMarkdown('## Heading\n- Item')

// Rich mode only: toggle raw markdown editor in-place
ed.toggleMarkdownMode()
ed.isMarkdownMode() // true/false

// Update length limits at runtime (revalidates + refreshes counter immediately)
ed.setLimits(5, 300)
ed.setLimits({ max: 120 }) // min unchanged
ed.setLimits({ min: null }) // clear min limit
```

`setLimits(...)` accepts `(min, max)` or `{ min, max }`.
`undefined` keeps existing bounds, `null` clears a bound.

Notes:
- Markdown mode is rendered with fvn-ui textarea input styling.
- Heading toggle is fixed to `h3`.
- `underline` / `strikethrough` in `richInclude` are ignored (no crash).
- `toMarkdown()` returns CommonMark output.
- If markdown text is unchanged while toggling back to rich mode, previous HTML output is restored.

---

### `toggleGroup({ items, active, callback })`

Tab-style button group for selection (tabs without content panel).

```js
toggleGroup({
  items: [{ label: 'Day' }, { label: 'Week' }, { label: 'Month' }],
  active: 0,
  callback: (index) => setView(index)
})

// With icons
toggleGroup({
  items: [{ icon: 'list' }, { icon: 'grid' }],
  variant: 'ghost'
})
```

| Prop | Description |
|------|-------------|
| `items` | Array of `{ label, icon, color }` |
| `active` | Initially active index |
| `callback` | Called with active index on change |
| `variant` | `'default'`, `'outline'`, `'ghost'`, `'minimal'` |
| `shape` | `'round'` |
| `shade` | Shaded background |

---

### `dashboard({ title, views })`

View management with sidebar navigation.

```js
dashboard(document.body, {
  title: 'My App',
  description: 'App description',
  views: [
    { label: 'Home', icon: 'home', render: () => homeView() },
    { label: 'Settings', icon: 'settings', render: () => settingsView() }
  ]
})
```

| Prop | Description |
|------|-------------|
| `title` | App title in sidebar |
| `description` | Subtitle |
| `views` | Array of `{ label, icon, render }` |
| `active` | Initial view index |
| `onNavigate` | Called on view change |

---

### Text Helpers

```js
text.title('Page Title')           // <h2>
text.description('Subtitle text')  // <span class="muted">
text.label('Field Label')          // <label>
text.header({ title: 'Title', description: 'Desc' })  // title + description group
text.divider()                      // horizontal rule
text.divider({ vertical: true })    // vertical divider (for rows)
```

---

## Icons

### Built-in Icons

`check`, `x`, `plus`, `minus`, `search`, `settings`, `user`, `users`, `mail`, `phone`, `calendar`, `clock`, `star`, `heart`, `home`, `menu`, `more`, `edit`, `trash`, `copy`, `download`, `upload`, `link`, `external`, `chevron-up`, `chevron-down`, `chevron-left`, `chevron-right`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `sun`, `moon`, `eye`, `eye-off`, `lock`, `unlock`, `bell`, `filter`, `sort`, `refresh`, `info`, `warning`, `error`, `success`

### Extending Icons

Add custom icons from [Feather Icons](https://feathericons.com) or [Lucide](https://lucide.dev/icons):

```js
import { svg } from 'fvn-ui'

// Add custom icons - use SVG inner content only (no <svg> wrapper)
svg.extend({
  // From Lucide: copy the path/circle/line elements inside <svg>
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  
  // From Feather: same approach
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'
})

// Now use them
button({ icon: 'github', label: 'GitHub' })
svg('activity')

// List all available icons
svg.list() // ['check', 'x', ..., 'github', 'activity']
```

**How to extract icon content:**
1. Find icon on [lucide.dev/icons](https://lucide.dev/icons) or [feathericons.com](https://feathericons.com)
2. Copy the SVG code
3. Remove the outer `<svg>...</svg>` wrapper
4. Keep only the inner elements (`<path>`, `<circle>`, `<line>`, `<polyline>`, etc.)

---

## Colors

`primary`, `red`, `green`, `blue`, `pink`, `yellow`, `orange`

```js
button({ color: 'red' })
switchComponent({ color: 'primary' })
avatar({ color: 'blue' })
```

---

## Decision Tree: Which Component?

Use this tree to select the right component:

```
User needs boolean input?
├─ Yes → Is it a setting/preference?
│        ├─ Yes → switchComponent({ label, onChange })
│        └─ No → Is it an agreement/checkbox list?
│                 ├─ Yes → checkbox({ label })
│                 └─ No → Is it a visible A/B choice?
│                          ├─ Yes → toggle({ options: ['A', 'B'] })
│                          └─ No → switchComponent()
│
└─ No → User needs to select from options?
         ├─ Yes → How many options?
         │        ├─ 2-5 options → radio({ items: [...] })
         │        └─ 6+ options → selectComponent({ options: [...] })
         │
         └─ No → User needs text input?
                  ├─ Yes → Short or long text?
                  │        ├─ Short (1 line) → input({ label })
                  │        └─ Long (multi-line) → input({ label, rows: 4 })
                  │
                  └─ No → User needs to trigger action?
                           ├─ Yes → button({ label, onClick })
                           └─ No → Display content?
                                    ├─ Yes → card(), text.title(), text.description()
                                    └─ No → Raw element → el('tag', {...})
```

---

## Anti-Patterns — NEVER DO THIS

### ❌ Using input for booleans
```js
// WRONG
input({ type: 'checkbox', label: 'Enable feature' })

// CORRECT
switchComponent({ label: 'Enable feature' })
```

### ❌ Value as instructional text
```js
// WRONG - value persists, confuses users
input({ label: 'Email', value: 'Enter your email here' })

// CORRECT - placeholder disappears on focus
input({ label: 'Email', placeholder: 'Enter your email here' })
```

### ❌ Inputs without labels
```js
// WRONG - accessibility issue, unclear purpose
input({ placeholder: 'Search...' })

// CORRECT
input({ label: 'Search', placeholder: 'Enter search term...' })
```

### ❌ Flat structure without layout
```js
// WRONG - no visual hierarchy
button({ label: 'Save' })
button({ label: 'Cancel' })
input({ label: 'Name' })

// CORRECT - structured with layout helpers
layout.col({ gap: 4 }, [
  input({ label: 'Name' }),
  layout.row({ gap: 2, justify: 'end' }, [
    button({ label: 'Cancel', variant: 'ghost' }),
    button({ label: 'Save', variant: 'primary' })
  ])
])
```

### ❌ Multiple primary buttons
```js
// WRONG - confuses user about main action
button({ label: 'Save', variant: 'primary' })
button({ label: 'Submit', variant: 'primary' })

// CORRECT - one primary, others secondary
button({ label: 'Save Draft', variant: 'outline' })
button({ label: 'Publish', variant: 'primary' })
```

### ❌ Radio for many options
```js
// WRONG - radio with 10+ options is overwhelming
radio({ items: arrayOf15Items })

// CORRECT - select with filter for many options
selectComponent({ options: arrayOf15Items, filter: true })
```

---

## Complete Page Patterns

### Settings Page
```js
ui.card({
  title: 'Account Settings',
  description: 'Manage your account preferences',
  content: ui.col({ gap: 6 }, [
    // Profile section
    ui.col({ gap: 4 }, [
      ui.row({ gap: 4 }, [
        ui.input({ label: 'First Name', placeholder: 'John', flex: 1 }),
        ui.input({ label: 'Last Name', placeholder: 'Doe', flex: 1 })
      ]),
      ui.input({ label: 'Email', type: 'email', placeholder: 'john@example.com' }),
      ui.input({ label: 'Bio', rows: 3, placeholder: 'About yourself...' })
    ]),
    
    // Preferences section
    ui.col({ gap: 3 }, [
      ui.switch({ label: 'Email notifications' }),
      ui.switch({ label: 'Dark mode' }),
      ui.switch({ label: 'Two-factor auth', color: 'primary' })
    ]),
    
    // Actions (bottom, right-aligned)
    ui.row({ gap: 2, justify: 'end' }, [
      ui.button({ label: 'Cancel', variant: 'ghost' }),
      ui.button({ label: 'Save', variant: 'primary' })
    ])
  ])
})
```

### Login Form
```js
ui.card({
  title: 'Sign In',
  content: ui.col({ gap: 4 }, [
    ui.input({ label: 'Email', type: 'email', placeholder: 'you@example.com', required: true }),
    ui.input({ label: 'Password', type: 'password', placeholder: '••••••••', required: true }),
    ui.row({ justify: 'between', align: 'center' }, [
      ui.checkbox({ label: 'Remember me' }),
      ui.el('a', { href: '/forgot', text: 'Forgot password?', class: 'small muted' })
    ]),
    ui.button({ label: 'Sign In', variant: 'primary', width: 'full' })
  ])
})
```

### Data Entry Form
```js
ui.card({
  title: 'New Item',
  content: ui.col({ gap: 4 }, [
    ui.input({ label: 'Name', placeholder: 'Item name', required: true }),
    ui.input({ label: 'Description', rows: 3, placeholder: 'Describe...' }),
    ui.row({ gap: 4 }, [
      ui.input({ label: 'Price', type: 'number', min: 0, step: 0.01, flex: 1 }),
      ui.input({ label: 'Quantity', type: 'number', min: 1, flex: 1 })
    ]),
    ui.select({ label: 'Category', placeholder: 'Select...', options: categories }),
    ui.row({ gap: 2, justify: 'end' }, [
      ui.button({ label: 'Cancel', variant: 'outline' }),
      ui.button({ label: 'Create', variant: 'primary' })
    ])
  ])
})
```

### Filter/Search Panel
```js
ui.card({
  title: 'Filters',
  content: ui.col({ gap: 4 }, [
    ui.input({ label: 'Search', placeholder: 'Search items...', icon: 'search' }),
    ui.select({ label: 'Category', options: categories, placeholder: 'All categories' }),
    ui.row({ gap: 4 }, [
      ui.input({ label: 'Min Price', type: 'number', min: 0, flex: 1 }),
      ui.input({ label: 'Max Price', type: 'number', min: 0, flex: 1 })
    ]),
    ui.col({ gap: 2 }, [
      ui.checkbox({ label: 'In stock only' }),
      ui.checkbox({ label: 'On sale' }),
      ui.checkbox({ label: 'Free shipping' })
    ]),
    ui.row({ gap: 2 }, [
      ui.button({ label: 'Reset', variant: 'ghost' }),
      ui.button({ label: 'Apply Filters', variant: 'primary' })
    ])
  ])
})
```

### Dashboard with Navigation
```js
ui.dashboard(document.body, {
  title: 'My App',
  description: 'Dashboard',
  menu: [
    { icon: 'home', view: 'home' },
    { icon: 'users', view: 'users' },
    { icon: 'settings', view: 'settings' },
    { icon: 'moon', action: () => document.documentElement.classList.toggle('dark') }
  ],
  views: {
    home: () => ui.tabs({
      variant: 'outline',
      items: [
        { label: 'Overview', render: () => overviewContent() },
        { label: 'Analytics', render: () => analyticsContent() }
      ]
    }),
    users: () => usersPage(),
    settings: () => settingsPage()
  }
})
```

### Confirmation Dialog
```js
ui.confirm({
  label: 'Delete',
  variant: 'outline',
  color: 'red',
  title: 'Delete this item?',
  description: 'This action cannot be undone.',
  confirm: 'Delete',
  confirmColor: 'red',
  cancel: 'Cancel',
  onConfirm: () => deleteItem(id)
})
```

---

## Quick Reference Card

| Task | Code |
|------|------|
| Button | `ui.button({ label: 'Click', variant: 'primary' })` |
| Input | `ui.input({ label: 'Name', placeholder: 'Enter...' })` |
| Textarea | `ui.input({ label: 'Bio', rows: 4 })` |
| Number | `ui.input({ label: 'Age', type: 'number', min: 0 })` |
| Switch | `ui.switch({ label: 'Enable', onChange: fn })` |
| Checkbox | `ui.checkbox({ label: 'Accept terms' })` |
| Radio | `ui.radio({ items: [...], value: 'a' })` |
| Select | `ui.select({ options: [...], placeholder: '...' })` |
| Card | `ui.card({ title: '...', content: [...] })` |
| Row | `ui.row({ gap: 2 }, [children])` |
| Column | `ui.col({ gap: 4 }, [children])` |
| Element | `ui.el('div', { class: '...', text: '...' })` |
