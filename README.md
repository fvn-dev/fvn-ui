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
| `dialog` / `modal` / `tooltip` | Modal dialogs and popovers |
| `confirm` | Confirmation dialog with trigger button |
| `input` / `textarea` | Text input with label and validation |
| `checkbox` / `switch` / `toggle` | Boolean inputs (use `ui.switch()` or `switchComponent`) |
| `radio` | Radio button group |
| `select` | Dropdown with filter and multiselect (use `ui.select()` or `selectComponent`) |
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
