## fvn-ui
Minimal vanilla JS component library with layout helpers. Zero dependencies.

> **🤖 AI/LLM Users**: See [AGENTS.md](./AGENTS.md) for quick reference or [LLM.md](./LLM.md) for complete documentation.

### Quick Start

**Via [CDN](https://unpkg.com/fvn-ui/dist/ui.js)**
```html
<script src="https://unpkg.com/fvn-ui/dist/ui.js"></script>
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

```js
import { layout, button, switchComponent } from 'fvn-ui'
```

Or use the `ui` namespace for cleaner access (also avoids reserved words like `switch`):
```js
import { ui } from 'fvn-ui'

ui.button({ label: 'Save' })
ui.switch({ label: 'Dark mode' })
ui.layout.row([ ... ])
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
| `modal` / `tooltip` | Dialogs / popovers |
| `confirm` | Confirmation dialog |
| `editable` | Contenteditable with common text input features |
| `input` / `textarea` | Text input with label and validation |
| `switch` / `toggle` / `toggleGroup` | Boolean inputs (use `ui.switch()` or `switchComponent`) |
| `checkbox` | Checkbox |
| `radio` | Radio button group |
| `select` | Dropdown with filter and multiselect (use `ui.select()` or `selectComponent`) |
| `tabs` | Tabbed content |
| `collapsible` | Expandable sections |
| `dashboard` | View management with navigation |
| `avatar` / `image` / `svg` | Media components |
| `label` | Text label |

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
# Copy documentation to project root
cp node_modules/fvn-ui/AGENTS.md .
cp node_modules/fvn-ui/LLM.md .
```

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
