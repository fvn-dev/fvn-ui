/*
  TODO
    - AI rettskriving
    - rich tooltip(s): buttons too big, url needs fvn-ui class

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
  upload,

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
export const darkmode = (() => {
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const modeKey = 'darkmodeMode';

  const normalizeMode = (value) => {
    const mode = String(value || '').toLowerCase();
    return mode === 'on' || mode === 'off' || mode === 'auto' ? mode : 'auto';
  };

  let mode = normalizeMode(root.dataset[modeKey] || root.dataset.darkmode);
  const getMode = () => mode;
  const resolveDark = () => {
    return mode === 'on' || (mode === 'auto' && media.matches);
  };

  const sync = () => {
    const dark = resolveDark();
    root.dataset.darkmode = dark ? 'on' : 'off';
    return dark;
  };

  const setMode = (nextMode) => {
    mode = normalizeMode(nextMode);
    root.dataset[modeKey] = mode;
    return sync();
  };

  const isDark = () => resolveDark();
  const getIcons = () => isDark() ? ['sun', 'moon'] : ['moon', 'sun'];
  const toggle = (on) => {
    if (on === 'auto') return setMode('auto');
    if (typeof on === 'boolean') return setMode(on ? 'on' : 'off');
    return setMode(isDark() ? 'off' : 'on');
  };

  const syncOnReady = () => requestAnimationFrame(sync);
  root.dataset[modeKey] = mode;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncOnReady, { once: true });
  } else {
    syncOnReady();
  }

  media.addEventListener?.('change', () => {
    if (mode === 'auto') sync();
  });

  return {
    isDark,
    getIcons,
    toggle,
    setMode,
    getMode,
    sync,
    menuItem: { icon: getIcons(), action: () => toggle() }
  }
})();

const init = (root = document.body) => {
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
