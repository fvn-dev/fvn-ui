import { el, row, col, parseArgs, propsToClasses } from '../dom.js'
import { button } from './button.js'
import { header } from './text.js'
import './dashboard.css'

const MENU_DEFAULTS = { shape: 'round', variant: 'ghost' };

/**
 * Creates a dashboard layout with header, menu, and view system
 * @param {Object} config
 * @param {string} [config.title] - Dashboard title
 * @param {string} [config.description] - Dashboard description
 * @param {{icon: string, action?: Function, view?: string}[]} [config.menu] - Menu buttons
 * @param {Object.<string, Function>} [config.views] - Named view render functions
 * @param {string} [config.defaultView='default'] - Initial view key
 * @param {string} [config.id] - Registers to dom.dashboard[id] and dom[id]
 * @returns {HTMLDivElement} Dashboard element with navigate(viewKey) method
 * @example
 * dashboard(document.body, {
 *   title: 'My App',
 *   menu: [{ icon: 'moon', action: toggleDark }, { icon: 'settings', view: 'settings' }],
 *   views: { default: () => mainContent(), settings: () => settingsPanel() }
 * })
 */
export function dashboard(...args) {
  const {
    parent,
    title = '',
    description = '',
    menu = [],
    views = {},
    defaultView = 'default',
    props = {},
    ...rest
  } = parseArgs(...args);

  let contentEl;
  let currentView = defaultView;

  const viewKeys = Object.keys(views);
  const initialKey = views[defaultView]
    ? defaultView 
    : views.main
      ? 'main' 
      : views.root
        ? 'root' 
        : viewKeys[0] || null;

  const navigate = (viewKey) => {
    if (!views[viewKey]) {
      return;
    }
    currentView = viewKey === currentView ? initialKey : viewKey;
    renderView();
  };

  const renderView = () => {
    contentEl.innerHTML = '';
    const renderer = views[currentView];
    if (!renderer) {
      return;
    }

    if (currentView !== initialKey) {
      button(contentEl, {
        icon: 'x',
        variant: 'ghost',
        shape: 'round',
        class: 'ui-dashboard__close',
        onClick: () => navigate(initialKey)
      });
    }

    const out = renderer();
    if (!out) {
      return;
    }
    if (typeof out === 'string') {
      contentEl.innerHTML += out;
      return;
    }
    if (Array.isArray(out)) {
      for (const o of out) contentEl.appendChild(o);
      return;
    }

    contentEl.appendChild(out);
  };

  const menuButtons = menu.map(({ view, action, ...btnOpts }) => 
    button({
      ...MENU_DEFAULTS,
      ...btnOpts,
      onClick: (e) => {
        view && navigate(view);
        action?.(e);
        btnOpts.onClick?.(e);
      }
    })
  );

  const headerEl = row('between', {
    class: ['ui-dashboard__header', 'border-bottom', propsToClasses(props)],
    children: [
      header({ title, description, large: true, gap: 1, flex: 1 }),
      row({ gap: 0, class: 'ui-dashboard__menu', children: menuButtons })
    ]
  });

  const root = col(parent, {
    ...rest,
    class: ['ui-dashboard', rest.class],
    gap: 4,
    children: [
      headerEl,
      el('div', { class: 'ui-dashboard__content', ref: (e) => contentEl = e })
    ]
  });

  if (initialKey) {
    currentView = initialKey;
    renderView();
  }

  root.navigate = navigate;
  root.getCurrentView = () => currentView;

  return root;
}
