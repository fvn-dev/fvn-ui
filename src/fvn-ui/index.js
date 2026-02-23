/*
  TODO
    - bug: el({ children }) not working?
    - bug: row|col does not allow { class }
    - add counter min/max to editable
    - add hover info-tip option for all components (eg. for buttons with icon only)
    - add label option to toggle (switch)
    - move "dashboard" component under layout category?
    - Add clamping functionality to number input component? custom arrows
    - "copy text" icon option for input/textarea
    - keyboard element ([enter]) to display where available (eg. input)
    - prefix/ postfix elements for input (eg. currency symbol, units, https:// etc.) https://swr.vercel.app/
*/

/**
 * fvn-ui — Minimalist vanilla JS component library
 * Requires a bundler that handles CSS imports (Vite, Webpack, etc.)
 * @see ./LLM.md for usage reference
 */
import './style.css'

export { dom, colors, el, row, col } from './dom.js'
export { template, processTemplates, autoProcess } from './template.js'

export {
  avatar,
  button,
  card,
  checkbox,
  collapsible,
  confirm,
  dashboard,
  dialog,
  draggable,
  editable,
  image,
  input,
  modal,
  radio,
  selectComponent,
  toggleGroup,
  svg,
  switchComponent,
  tabs,
  textarea,
  toggle,
  tooltip,

  // Text primitives
  text,
  description,
  divider,
  header,
  title
} from './components/index.js'

// Namespaced export for cleaner DX: ui.button(), ui.switch(), etc.
import * as components from './components/index.js'
import { layout as _layout, dom, el, row, col, colors } from './dom.js'

// Extend layout namespace with container and text components
export const layout = {
  ..._layout,
  card: components.card,
  dashboard: components.dashboard,
  label: components.label,
  header: components.header,
  title: components.title,
  description: components.description,
  divider: components.divider
};

/**
 * Dark mode toggle helper
 * @returns {{ isDark: boolean, icons: [string, string], toggle: () => boolean }}
 * @example
 * // In dashboard actions
 * const dm = ui.darkmode()
 * dashboard({ actions: [{ icon: dm.icons, action: dm.toggle }] })
 * 
 * // Manual toggle
 * ui.darkmode().toggle()
 */
let container = document.body;

export const darkmode = (() => {
  const getIcons = () => isDark() ? ['sun', 'moon'] : ['moon', 'sun'];
  const isDark = () => container.classList.contains('dark');
  const toggle = on => {
    return container.classList.toggle('dark', on);
  };
  if (matchMedia('(prefers-color-scheme: dark)').matches) {
    toggle(true);
  }
  return {
    isDark,
    getIcons,
    toggle,
    menuItem: { icon: getIcons(), action: () => toggle() }
  }
})();

const init = (root = document.body) => {
  container = root;
  root.classList.add('fvn-ui');
};

export const ui = {
  ...components,
  select: components.selectComponent,
  switch: components.switchComponent,
  layout,
  darkmode,
  dom,
  el,
  row,
  col,
  colors,
  init
};

!globalThis._uiManualInit && init();