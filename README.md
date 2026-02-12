## fvn-ui
Minimal vanilla JS component library with layout helpers. Zero dependencies.

```js
import { layout, button, card } from 'fvn-ui'
```

Tree-shakeable imports:
```js
import 'fvn-ui/style.css'
import { button } from 'fvn-ui/button'
import { card } from 'fvn-ui/card'
```

### Components

| Component | Description |
|-----------|-------------|
| `button` | Buttons with variants, colors, icons |
| `card` | Container with title, description, content |
| `dialog` / `modal` / `tooltip` | Modal dialogs and popovers |
| `confirm` | Confirmation dialog with trigger button |
| `input` | Text input with label and validation |
| `checkbox` / `switchComponent` / `toggle` | Boolean inputs |
| `radioGroup` | Radio button group |
| `selectComponent` | Dropdown with filter and multiselect |
| `tabs` | Tabbed content |
| `collapsible` | Expandable sections |
| `dashboard` | View management with navigation |
| `avatar` / `image` / `svg` | Media components |
| `label` | Text label |

### Layout Helpers

All functions accept arguments in any order — parent element, config object, and children array are detected by type, not position.

```js
import { el, row, col, layout } from 'fvn-ui'

layout.row({ gap: 4 }, [ button({ label: 'A' }), button({ label: 'B' }) ])
layout.col(parent, { gap: 2, align: 'center', children: [el('div', { onclick })] })
```

### Documentation

Each component has JSDoc with examples. See source files in `src/fvn-ui/components/`.
