## fvn-ui
Minimal vanilla JS component library with layout helpers. Zero dependencies.

> **🤖 AI/LLM Users**: See [AGENTS.md](./AGENTS.md) for quick reference or [LLM.md](./LLM.md) for complete documentation.

### Quick Start

**Via [CDN](https://unpkg.com/fvn-ui@latest/dist/ui.js)**
```html
<script src="https://unpkg.com/fvn-ui@latest/dist/ui.js"></script>
<script>
  // direct
  ui.card()
  // or granular
  const { card } = window.ui;
</script>
```

**Via [NPM](https://www.npmjs.com/package/fvn-ui)**
```bash
npm install fvn-ui
```

With a bundler (Vite, webpack, esbuild):
```js
import { ui } from 'fvn-ui'

ui.button({ label: 'Save' })
ui.switch({ label: 'Dark mode' })
```

Without a bundler (native ES modules):
```js
import { ui } from 'https://unpkg.com/fvn-ui@latest/dist/ui.esm.js'
```

Tree-shakeable imports (bundler only):
```js
import 'fvn-ui/style.css'
import { button } from 'fvn-ui/button'
import { card } from 'fvn-ui/card'
```

### Components

**Layout** (`layout.` or direct import)
| Component | Description |
|-----------|-------------|
| `row` / `col` | Flexbox containers (grow by default) |
| `card` | Container with title, description, content |
| `dashboard` | View management with navigation |
| `header` | Title + description group |
| `title` / `description` | Text primitives |
| `label` | Form label |
| `divider` | Horizontal/vertical separator |

**Inputs**
| Component | Description |
|-----------|-------------|
| `button` | Buttons with variants, colors, icons |
| `checkbox` | Checkbox |
| `editable` | Contenteditable with text input features |
| `input` / `textarea` | Text input with label and validation |
| `radio` | Radio button group |
| `select` | Dropdown with filter and multiselect |
| `switch` / `toggle` | Boolean inputs |
| `toggleGroup` | Tab-style button group |

**Overlays**
| Component | Description |
|-----------|-------------|
| `modal` / `tooltip` | Dialogs and popovers |
| `confirm` | Confirmation dialog with trigger |
| `collapsible` | Expandable sections |
| `tabs` | Tabbed content |

**Media**
| Component | Description |
|-----------|-------------|
| `avatar` | User avatar |
| `image` | Image with loading states |
| `svg` | Icon system |

### Layout Helpers

Flexbox containers that **grow by default** to fill parent. Args can be in any order.

```js
import { el, row, col, layout } from 'fvn-ui'

// Basic usage
layout.row([ button({ label: 'A' }), button({ label: 'B' }) ])
layout.col(parent, { gap: 2, children: [...] })

// Alignment shorthands (same for row and col)
row({ start: true }, [...])    // aligned left (default)
row({ center: true }, [...])   // centered
row({ end: true }, [...])      // aligned right
col({ end: true }, [...])      // aligned bottom

// Push child to end
row([
  button({ label: 'Cancel' }),
  button({ label: 'Save', end: true })  // pushed right
])

// Opt-out of grow
row({ grow: false }, [...])    // shrink to content
```

| Container Props | Description |
|-----------------|-------------|
| `gap: 4` | Space between children (0-10, default: 2) |
| `start`, `center`, `end` | Align children on main axis |
| `grow: false` | Shrink to content |

| Child Props | Description |
|-------------|-------------|
| `end: true` | Push to end (right in row, bottom in col) |
| `start: true` | Push to start |

| Spacing Props | Description |
|---------------|-------------|
| `padding: 4` | All-around padding (1-10) |
| `block: 4` | Vertical padding (1-10) |
| `inline: 4` | Horizontal padding (1-10) |

### Event Callbacks

All callbacks follow a consistent `(value, ...context, event)` pattern:

```js
// First arg is always the unwrapped value, last arg is the event
input({ onInput: (value, event) => console.log(value) })
checkbox({ onChange: (checked, event) => ... })
radio({ onChange: (value, item, event) => ... })
select({ onChange: (value, item, event) => ... })
tabs({ onChange: (value, item, event) => ... })

// `this` is bound to the element
input({ onChange(value) { console.log(this.id, value) } })
```

### Runtime Limit Updates

`input()` and `editable()` support runtime limit updates for validation/counters.

```js
const bio = ui.input({ label: 'Bio', rows: 4, counter: true, min: 10, max: 500 })
bio.setLimits(5, 300)
bio.setLimits({ max: 120 })  // min unchanged
bio.setLimits({ min: null }) // clear min

const notes = ui.editable({ label: 'Notes', counter: true, min: 10, max: 500 })
notes.setLimits({ max: 200 })
```

`setLimits(...)` accepts `(min, max)` or `{ min, max }`.
`undefined` keeps existing bounds, `null` clears a bound.

### Editable Markdown Mode

`editable({ rich: true })` uses a ProseMirror-backed editor with a markdown toggle.
Rich runtime is lazy-loaded only when `rich: true` is used (source/ESM builds).

```js
const ed = ui.editable({ label: 'Body', rich: true })

ed.toMarkdown()
ed.toSlackMarkdown()
ed.fromMarkdown('## Heading\n- Item')

ed.toggleMarkdownMode() // rich <-> markdown editor
ed.isMarkdownMode()     // true/false
```

- `onInput(html, event)` / `onChange(html, event)` always emit HTML in both modes.
- Markdown uses CommonMark serialization/parsing.
- If markdown is unchanged when toggling back, previous HTML output is restored.
- Unsupported `richInclude/richExclude` actions (`underline`, `strikethrough`) are ignored.

### CSS Variables

Common CSS variables available for custom styling. See [style.css](./src/fvn-ui/style.css) for full list.

| Variable | Description |
|----------|-------------|
| `--space-1` to `--space-10` | Spacing scale (used by gap, padding props) |
| `--back` | Background color |
| `--text` | Text color |
| `--muted` | Muted/secondary text |
| `--hover` | Hover state background |
| `--border` | Border color |
| `--radius` | Common border radius |

### AI Assistant Setup

When using AI coding assistants with fvn-ui, copy the docs to your project for better discoverability.

#### Quick Setup (all tools)
```bash
# Using npx (recommended)
npx fvn-ui

# Or add to package.json scripts
{
  "scripts": {
    "docs": "fvn-ui"
  }
}
```

This copies `AGENTS.md` and `LLM.md` to your project root.

#### Tool-Specific Rules

<details>
<summary><strong>GitHub Copilot (VS Code)</strong></summary>

**Option 1: Repository instructions (recommended)**
```bash
mkdir -p .github && cp node_modules/fvn-ui/RULES.md .github/copilot-instructions.md
```

**Option 2: VS Code settings** (Cmd/Ctrl+Shift+P → "Preferences: Open User Settings (JSON)")
```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    { "file": "AGENTS.md" },
    { "file": "LLM.md" }
  ]
}
```

Copilot also auto-discovers `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` in project root.

</details>

<details>
<summary><strong>Cursor</strong></summary>

**Option 1: Project rules (recommended)**
```bash
mkdir -p .cursor/rules && cp node_modules/fvn-ui/RULES.md .cursor/rules/fvn-ui.md
```

**Option 2: Legacy `.cursorrules`** (still supported, will be deprecated)
```bash
cp node_modules/fvn-ui/RULES.md .cursorrules
```

**Option 3: User rules** (Cursor Settings → Rules → add global rules)

Cursor also auto-discovers `AGENTS.md` in project root and subdirectories.

</details>

<details>
<summary><strong>Windsurf</strong></summary>

**Option 1: Workspace rules (recommended)**
```bash
mkdir -p .windsurf/rules && cp node_modules/fvn-ui/RULES.md .windsurf/rules/fvn-ui.md
```

**Option 2: Global rules** (applies to all projects)
Create/edit `~/.windsurf/global_rules.md` and paste contents of RULES.md.

</details>

<details>
<summary><strong>Claude (Anthropic)</strong></summary>

```bash
cp node_modules/fvn-ui/RULES.md CLAUDE.md
```

Claude looks for `CLAUDE.md` in project root.

</details>

<details>
<summary><strong>Other AI Tools</strong></summary>

Most AI tools look for `AGENTS.md` in the project root (already copied above).
If your tool supports custom instructions, point it to `LLM.md` for complete documentation.

</details>

### Documentation

Each component has JSDoc with examples. See source files in `src/fvn-ui/components/` or [example page](https://fvn-dev.github.io/fvn-ui/index.html).
