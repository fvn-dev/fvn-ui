import { el, getCallback, withValue, parseArgs, propsToClasses } from '../dom.js'
import { label as textLabel } from './text.js'
import './switch.css'

/**
 * Creates a toggle switch
 * @param {Object} config
 * @param {string} [config.label] - Switch label (clickable)
 * @param {boolean} [config.checked] - Initial checked state
 * @param {boolean} [config.disabled] - Disabled state
 * @param {'default'|'primary'|'red'|'green'|'blue'} [config.color='default'] - Switch color when checked
 * @param {Function} [config.onChange] - Called with (checked, event)
 * @param {string} [config.id] - Registers to dom.switch[id] and dom[id]
 * @returns {HTMLDivElement} Switch element with .value getter/setter
 * @example
 * switchComponent({ label: 'Dark mode', checked: true })
 * switchComponent({ label: 'Notifications', color: 'primary', onChange: (v) => save(v) })
 */
export function switchComponent(...args) {
  const {
    parent,
    checked,
    disabled,
    color = 'default',
    label,
    id,
    props = {},
    ...rest
  } = parseArgs(...args);

  const cb = getCallback('onChange', rest);
  let btnEl;
  let state = !!checked;

  const setState = (next, e) => {
    state = !!next;
    root.dataset.checked = state;
    btnEl.setAttribute('aria-checked', state);
    e && cb?.(state, e);
  };

  const toggle = (e) => {
    if (disabled) {
      return;
    }
    setState(!state, e);
  };

  const onKeydown = (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') {
      return;
    }
    e.preventDefault();
    toggle(e);
  };

  const root = el('div', parent, {
    ...rest,
    class: ['ui-switch', propsToClasses(props), rest.class],
    data: { checked: state, uiCol: color },
    children: [
      el('button', {
        type: 'button',
        class: 'ui-switch__button',
        attrs: { role: 'switch', 'aria-checked': state },
        id,
        disabled,
        ref: (e) => btnEl = e,
        children: [el('span', { class: 'ui-switch__thumb' })],
        onClick: toggle,
        onKeydown
      }),
      label && textLabel({ 
        text: label, 
        small: true,
        onClick: toggle,
        style: { cursor: disabled ? 'default' : 'pointer' }
      })
    ]
  });

  return withValue(root, () => state, setState);
}
