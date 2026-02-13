/**
 * fvn-ui — Minimalist vanilla JS component library
 * Requires a bundler that handles CSS imports (Vite, Webpack, etc.)
 * @see ./LLM.md for usage reference
 */
import './style.css'

export { dom, colors, el, row, col, layout } from './dom.js'
export { template, processTemplates, autoProcess } from './template.js'

export {
  avatar,
  button,
  buttonGroup,
  card,
  checkbox,
  collapsible,
  confirm,
  dashboard,
  dialog,
  image,
  input,
  modal,
  radio,
  selectComponent,
  svg,
  switchComponent,
  tabs,
  toggle,
  tooltip,

  // Text primitives
  text,
  title,
  description,
  header
} from './components/index.js'

// Namespaced export for cleaner DX: ui.button(), ui.switch(), etc.
import * as components from './components/index.js'
import { layout } from './dom.js'
export const ui = {
  ...components,
  select: components.selectComponent,
  switch: components.switchComponent,
  layout
};

document.body.classList.add('fvn-ui');

if (matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}