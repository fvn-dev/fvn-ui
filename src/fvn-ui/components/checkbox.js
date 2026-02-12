import { el, getCallback, withValue, parseArgs, propsToClasses } from '../dom.js'
import { svg } from './svg.js'
import { label as textLabel } from './text.js'
import './form.css'
import './checkbox.css'

/**
 * Creates a checkbox input
 * @param {Object} config
 * @param {string} [config.label] - Checkbox label
 * @param {boolean} [config.checked] - Initial checked state
 * @param {boolean} [config.disabled] - Disabled state
 * @param {string} [config.value='on'] - Form value when checked
 * @param {'primary'|'red'|'green'|'blue'} [config.color] - Checkbox color when checked
 * @param {Function} [config.onChange] - Called with (checked, event)
 * @param {string} [config.id] - Registers to dom.checkbox[id] and dom[id]
 * @returns {HTMLLabelElement} Checkbox element with .value getter/setter
 * @example
 * checkbox({ label: 'Accept terms' })
 * checkbox({ label: 'Premium', color: 'blue', checked: true })
 */
export function checkbox(...args) {
  const {
    parent,
    checked,
    disabled,
    label,
    id,
    name,
    value = 'on',
    color,
    props = {},
    ...rest
  } = parseArgs(...args);

  const cb = getCallback('onChange', rest);
  let inputEl, controlEl;
  let state = !!checked;

  const getStateStr = () => state ? 'checked' : 'unchecked';
  const getColor = () => {
    if (state) {
      return color || 'default';
    }
    return `sub-${color || 'default'}`;
  };

  const setState = (next, e) => {
    state = !!next;
    inputEl.checked = state;
    root.dataset.state = getStateStr();
    controlEl.dataset.uiCol = getColor();
    e && cb?.(state, e);
  };

  const root = el('label', parent, {
    ...rest,
    class: ['ui-checkbox ui-form-item', disabled && 'disabled', propsToClasses(props), rest.class],
    data: { state: getStateStr() },
    children: [
      el('input', {
        type: 'checkbox',
        class: 'ui-form-input',
        id, name, value, disabled,
        checked: state,
        ref: (e) => inputEl = e,
        onChange: (e) => setState(e.target.checked, e)
      }),
      el('span', { 
        class: 'ui-form-control ui-border',
        data: { uiCol: getColor() },
        ref: (e) => controlEl = e,
        html: svg('check')
      }),
      label && textLabel({ text: label, small: true })
    ]
  });

  return withValue(root, () => state, setState);
}
