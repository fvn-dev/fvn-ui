import { el, col, getCallback, withValue, parseArgs, configToClasses, bemFactory } from '../dom.js'
import { button } from './button.js'
import { svg } from './svg.js'
import './collapsible.css'

const bem = bemFactory('collapsible');

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
    class: [bem(), disabled && 'disabled', configToClasses(rest), rest.class],
    data: { open: state },
    children: [
      button({
        class: bem.el('trigger'),
        variant: 'none',
        disabled,
        icon: state ? 'chevronDown' : 'chevronRight',
        label,
        onclick: toggle,
        ref: (btn) => iconEl = btn.querySelector('.ui-btn__icon')
      }),
      col({ class: [bem.el('content'), 'block-2'] }, [content])
    ]
  });

  return withValue(root, () => state, (v) => {
    state = !!v;
    root.dataset.open = state;
    iconEl.innerHTML = getIcon();
  });
}
