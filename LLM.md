# fvn-ui — LLM Reference

A minimalist vanilla JS component library. No framework, no build complexity.

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

Flexbox containers. Args can be in any order.

```js
layout.row([child1, child2])                       // horizontal, default gap
layout.row({ gap: 4, children: [child1, child2] }) // explicit
layout.col({ gap: 4, justify: 'between' }, [...])  // children as arg
```

**Props:** `gap`, `align`, `justify`, `padding`, `width`, `flex`

| Align/Justify | Description |
|---------------|-------------|
| `start` | Flex start |
| `center` | Center |
| `end` | Flex end |
| `between` | Space between |
| `stretch` | Stretch (align only) |

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

---

### `editable({ label, placeholder, onChange })`

Rich text editable div with input-like behavior. **Solves common editable quirks.**

```js
// Multiline by default
editable({ placeholder: 'Type here...' })

// With label and change handler
editable({ 
  label: 'Notes', 
  placeholder: 'Add your notes...',
  onChange: ({ value, html }) => save(value)
})

// Single line mode (rows: 1 or multiline: false)
editable({ 
  label: 'Title',
  rows: 1,
  onSubmit: ({ value }) => rename(value)
})

// Multiline with min-height (rows sets height)
editable({ label: 'Bio', rows: 5 })

// Plain text only (strips formatting on paste)
editable({ label: 'Code', plainText: true })

// Inline style rendering (no border/ padding)
editable({ label: 'Code', plain: true })
```

| Prop | Description |
|------|-------------|
| `label` | Input label |
| `placeholder` | Shown when empty (via CSS :empty) |
| `value` | Initial HTML content |
| `rows` | `1` = single line, `> 1` = multiline with min-height |
| `multiline` | `false` = single line (same as `rows: 1`) |
| `plainText` | Strip formatting on paste |
| `onChange` | `({ value, html, element }) => {}` |
| `onInput` | Called on every keystroke |
| `onSubmit` | Called on Enter (single line only) |
| `onFocus/onBlur` | Focus events |

**Features:**
- Placeholder disappears when content is entered (`:empty` CSS)
- Always has minimum clickable height (zero-width space trick)
- `.value` getter/setter for text content
- `.html` getter/setter for HTML content
- Same `rows`/`multiline` API as `input()`

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
modal({ 
  open: clickEvent, 
  content: card({ title: 'Edit Profile', content: form })
})

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

## Available Icons

`check`, `x`, `plus`, `minus`, `search`, `settings`, `user`, `users`, `mail`, `phone`, `calendar`, `clock`, `star`, `heart`, `home`, `menu`, `more`, `edit`, `trash`, `copy`, `download`, `upload`, `link`, `external`, `chevron-up`, `chevron-down`, `chevron-left`, `chevron-right`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `sun`, `moon`, `eye`, `eye-off`, `lock`, `unlock`, `bell`, `filter`, `sort`, `refresh`, `info`, `warning`, `error`, `success`

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
| editable | `ui.editable({ label: 'Notes', placeholder: '...' })` |
| Number | `ui.input({ label: 'Age', type: 'number', min: 0 })` |
| Switch | `ui.switch({ label: 'Enable', onChange: fn })` |
| Checkbox | `ui.checkbox({ label: 'Accept terms' })` |
| Radio | `ui.radio({ items: [...], value: 'a' })` |
| Select | `ui.select({ options: [...], placeholder: '...' })` |
| Card | `ui.card({ title: '...', content: [...] })` |
| Row | `ui.row({ gap: 2 }, [children])` |
| Column | `ui.col({ gap: 4 }, [children])` |
| Element | `ui.el('div', { class: '...', text: '...' })` |
