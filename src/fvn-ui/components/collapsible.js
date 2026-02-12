import { el, col, getCallback, withValue, parseArgs, propsToClasses } from '../dom.js'
import { button } from './button.js'
import { svg } from './svg.js'
import './collapsible.css'

/**
 * Creates a collapsible/accordion section
 * @param {Object} config
 * @param {string} config.label - Trigger label
 * @param {string|HTMLElement} [config.content] - Collapsible content
 * @param {boolean} [config.open] - Initially open
 * @param {boolean} [config.disabled] - Disabled state
 * @param {Function} [config.onChange] - Called with (isOpen)
 * @param {string} [config.id] - Registers to dom.collapsible[id] and dom[id]
 * @returns {HTMLDivElement} Collapsible element with .value getter/setter for open state
 * @example
 * collapsible({ label: 'Advanced Settings', content: card({ title: 'Settings' }) })
 * collapsible({ label: 'Details', open: true, content: 'Hidden content' })
 */
export function collapsible(...args) {
  const {
    parent,
    label,
    open,
    disabled,
    content,
    props = {},
    ...rest
  } = parseArgs(...args);

  const cb = getCallback('onChange', rest);
  let state = !!open;
  let iconEl;

  const getIcon = () => svg(state ? 'chevronDown' : 'chevronRight');

  const toggle = () => {
    if (disabled) {
      return;
    }
    state = !state;
    root.dataset.open = state;
    iconEl.innerHTML = getIcon();
    cb?.(state);
  };

  const root = el('div', parent, {
    ...rest,
    class: ['ui-collapsible', disabled && 'disabled', propsToClasses(props), rest.class],
    data: { open: state },
    children: [
      button({
        class: 'ui-collapsible__trigger',
        variant: 'none',
        disabled,
        icon: state ? 'chevronDown' : 'chevronRight',
        label,
        onclick: toggle,
        ref: (btn) => iconEl = btn.querySelector('.ui-btn__icon')
      }),
      col({ class: 'ui-collapsible__content block-2' }, [content])
    ]
  });

  return withValue(root, () => state, (v) => {
    state = !!v;
    root.dataset.open = state;
    iconEl.innerHTML = getIcon();
  });
}
