/**
 * fvn-ui — Minimalist vanilla JS component library
 * @see ./LLM.md for usage reference
 */
import './style.css'

export { dom, colors, el, row, col, layout, propsToClasses } from './dom.js'
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
  label,
  modal,
  radioGroup,
  selectComponent,
  svg,
  switchComponent,
  tabs,
  toggle,
  tooltip
} from './components/index.js'

document.body.classList.add('fvn-ui')
