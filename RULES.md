# fvn-ui Cursor Rules

You are an expert at building UIs with fvn-ui, a minimalist vanilla JS component library.

## When to use fvn-ui

Use fvn-ui when the user is:
- Building web UI with vanilla JavaScript (no React/Vue/Svelte)
- Creating forms, dashboards, settings panels, or data displays
- Needing quick, functional UI without heavy frameworks
- Working in a project that already uses fvn-ui

## Core Principles

1. **Always use layout helpers** — Never place components without `layout.row()` or `layout.col()`
2. **Always use labels** — Every form input MUST have a `label` prop
3. **Use placeholder for hints, value for data** — Never put instructional text in `value`
4. **One primary button per form** — Use `variant: 'primary'` for the main action only
5. **Native HTML props work** — `min`, `max`, `required`, `type`, `disabled` all pass through

## Component Selection Decision Tree

```
User needs boolean input?
├─ Yes → Is it a setting/preference?
│        ├─ Yes → switchComponent({ label, onChange })
│        └─ No → Is it an agreement/terms?
│                 ├─ Yes → checkbox({ label, required: true })
│                 └─ No → Is it a visible A/B choice?
│                          ├─ Yes → toggle({ options: ['A', 'B'] })
│                          └─ No → switchComponent()
└─ No → User needs to select from options?
         ├─ Yes → How many options?
         │        ├─ 2-5 options → radio({ items: [...] })
         │        └─ 6+ options → selectComponent({ options: [...] })
         └─ No → User needs text input?
                  ├─ Yes → Short or long text?
                  │        ├─ Short → input({ label, placeholder })
                  │        └─ Long → input({ label, rows: 4 })
                  └─ No → User needs to trigger action?
                           ├─ Yes → button({ label, onClick })
                           └─ No → Display content → card(), text.*
```

## Anti-Patterns — NEVER DO THIS

```js
// ❌ NEVER: Input for boolean values
input({ type: 'checkbox', label: 'Enable' })
// ✅ INSTEAD: Use switch
switchComponent({ label: 'Enable', onChange: handler })

// ❌ NEVER: Value as placeholder text
input({ label: 'Email', value: 'Enter your email' })
// ✅ INSTEAD: Use placeholder
input({ label: 'Email', placeholder: 'Enter your email' })

// ❌ NEVER: Inputs without labels
input({ placeholder: 'Name' })
// ✅ INSTEAD: Always include label
input({ label: 'Name', placeholder: 'Enter your name' })

// ❌ NEVER: Flat structure without layout
button({ label: 'Save' })
button({ label: 'Cancel' })
// ✅ INSTEAD: Use layout helpers
layout.row({ gap: 2 }, [
  button({ label: 'Cancel', variant: 'ghost' }),
  button({ label: 'Save', variant: 'primary' })
])

// ❌ NEVER: Multiple primary buttons
button({ label: 'Save', variant: 'primary' })
button({ label: 'Submit', variant: 'primary' })
// ✅ INSTEAD: One primary, others ghost/outline
button({ label: 'Cancel', variant: 'ghost' })
button({ label: 'Save', variant: 'primary' })

// ❌ NEVER: Radio for many options
radio({ items: arrayOf20Items })
// ✅ INSTEAD: Use select for 6+ options
selectComponent({ options: arrayOf20Items, filter: true })

// ❌ NEVER: Manual DOM creation when components exist
document.createElement('button')
// ✅ INSTEAD: Use fvn-ui components
button({ label: 'Click' })
```

## Complete Page Patterns

### Settings Page
```js
card({
  title: 'Account Settings',
  description: 'Manage your account preferences',
  content: layout.col({ gap: 6 }, [
    // Profile section
    layout.col({ gap: 4 }, [
      text.label('Profile', { muted: true }),
      layout.row({ gap: 4 }, [
        input({ label: 'First Name', placeholder: 'John', flex: 1 }),
        input({ label: 'Last Name', placeholder: 'Doe', flex: 1 })
      ]),
      input({ label: 'Email', type: 'email', placeholder: 'john@example.com' }),
      input({ label: 'Bio', rows: 3, placeholder: 'Tell us about yourself...' })
    ]),
    
    // Preferences section
    layout.col({ gap: 3 }, [
      text.label('Preferences', { muted: true }),
      switchComponent({ label: 'Email notifications' }),
      switchComponent({ label: 'Dark mode' }),
      switchComponent({ label: 'Two-factor authentication', color: 'primary' })
    ]),
    
    // Actions (always at bottom, aligned right)
    layout.row({ gap: 2, justify: 'end' }, [
      button({ label: 'Cancel', variant: 'ghost' }),
      button({ label: 'Save Changes', variant: 'primary' })
    ])
  ])
})
```

### Login Form
```js
card({
  title: 'Sign In',
  description: 'Enter your credentials',
  content: layout.col({ gap: 4 }, [
    input({ label: 'Email', type: 'email', placeholder: 'you@example.com', required: true }),
    input({ label: 'Password', type: 'password', placeholder: '••••••••', required: true }),
    layout.row({ gap: 4, justify: 'between', align: 'center' }, [
      checkbox({ label: 'Remember me' }),
      el('a', { href: '/forgot', text: 'Forgot password?', class: 'small muted' })
    ]),
    button({ label: 'Sign In', variant: 'primary', width: 'full' })
  ])
})
```

### Data Entry Form
```js
card({
  title: 'New Item',
  content: layout.col({ gap: 4 }, [
    input({ label: 'Name', placeholder: 'Item name', required: true }),
    input({ label: 'Description', rows: 3, placeholder: 'Describe the item...' }),
    layout.row({ gap: 4 }, [
      input({ label: 'Price', type: 'number', min: 0, step: 0.01, flex: 1 }),
      input({ label: 'Quantity', type: 'number', min: 1, flex: 1 })
    ]),
    selectComponent({
      label: 'Category',
      placeholder: 'Select category...',
      options: categories
    }),
    layout.row({ gap: 2, justify: 'end' }, [
      button({ label: 'Cancel', variant: 'outline' }),
      button({ label: 'Create', variant: 'primary' })
    ])
  ])
})
```

### Dashboard with Tabs
```js
dashboard(document.body, {
  title: 'My App',
  description: 'Dashboard',
  menu: [
    { icon: 'home', view: 'home' },
    { icon: 'settings', view: 'settings' },
    { icon: 'moon', action: () => document.documentElement.classList.toggle('dark') }
  ],
  views: {
    home: () => tabs({
      variant: 'outline',
      items: [
        { label: 'Overview', render: () => overviewContent() },
        { label: 'Analytics', render: () => analyticsContent() },
        { label: 'Reports', render: () => reportsContent() }
      ]
    }),
    settings: () => settingsPage()
  }
})
```

### Confirmation Modal
```js
confirm({
  label: 'Delete Item',
  variant: 'outline',
  color: 'red',
  title: 'Are you sure?',
  description: 'This action cannot be undone. The item will be permanently deleted.',
  confirm: 'Delete',
  confirmColor: 'red',
  cancel: 'Cancel',
  onConfirm: () => deleteItem(id)
})
```

## Spacing Guidelines

| Context | Gap Value |
|---------|-----------|
| Button groups | `gap: 2` |
| Checkbox/radio lists | `gap: 3` |
| Form fields | `gap: 4` |
| Form sections | `gap: 6` |
| Page sections | `gap: 8` |

## Import Pattern

Always use the `ui` namespace for cleaner code:

```js
import { ui } from 'fvn-ui'

// Use ui.* for all components
ui.button({ label: 'Click' })
ui.switch({ label: 'Toggle' })  // not switchComponent
ui.select({ options: [...] })   // not selectComponent
ui.row([...])
ui.col([...])
ui.el('div', { ... })
```

## Response Format

When generating fvn-ui code:
1. Always wrap in appropriate layout helpers
2. Include all required props (label for inputs)
3. Use semantic component choices
4. Follow spacing guidelines
5. Place actions at the bottom, aligned right
6. Use one primary button per form
