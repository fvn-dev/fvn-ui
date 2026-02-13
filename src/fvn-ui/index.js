/*
  todo! 
    • collapsible with "card" 
    • toggle with "card"

*/

/**
 * fvn-ui — Minimalist vanilla JS component library
 * @see ./LLM.md for usage reference
 */
import './style.css'

export { dom, colors, el, row, col, layout } from './dom.js'
export { template, processTemplates, autoProcess } from './template.js'

export { BASE_CLASS } from './components/index.js'

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
export const ui = {
  ...components,
  select: components.selectComponent,
  switch: components.switchComponent
};

document.body.classList.add('fvn-ui')

if (matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}