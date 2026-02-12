import { el, getCallback, withValue, parseArgs, propsToClasses } from '../dom.js'
import './radioGroup.css'

/**
 * Creates a radio button group
 * @param {Object} config
 * @param {{value: string, label: string, disabled?: boolean}[]} config.items - Radio options
 * @param {string} [config.value] - Initially selected value
 * @param {string} [config.label] - Group label
 * @param {'row'|'horizontal'} [config.orientation] - Layout direction
 * @param {boolean} [config.disabled] - Disable all options
 * @param {'default'|'primary'|'red'|'green'|'blue'} [config.color='default'] - Radio color
 * @param {Function} [config.onChange] - Called with (value, item, event)
 * @returns {HTMLDivElement} Radio group with .value getter/setter
 * @example
 * radioGroup({ value: 'apple', items: [{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }] })
 */
export function radioGroup(...args) {
  const {
    parent,
    items = [],
    value,
    name = `radio-${Math.random().toString(36).slice(2, 7)}`,
    label,
    orientation,
    disabled,
    color = 'default',
    props = {},
    ...rest
  } = parseArgs(...args);

  const cb = getCallback('onChange', rest);
  const list = items.flat();
  const isRow = /row|horizontal/i.test(orientation);
  const getVal = (it) => it?.value ?? it?.label ?? String(it ?? '');
  
  let current = value ?? getVal(list[0]);
  const radios = [];

  const setValue = (next, e) => {
    current = String(next);
    for (const r of radios) {
      const isChecked = r.value === current;
      r.input.checked = isChecked;
      r.el.dataset.state = isChecked ? 'checked' : 'unchecked';
      r.control.dataset.uiCol = isChecked ? color : `sub-${color}`;
    }
    e && cb?.(current, list.find((it) => getVal(it) === current), e);
  };

  const root = el('div', parent, {
    ...rest,
    class: ['ui-radio-group', isRow && 'horizontal', propsToClasses(props), rest.class],
    attrs: { role: 'radiogroup' },
    children: [
      label && el('span', { class: 'ui-radio-group__label', text: label }),
      el('div', {
        class: 'ui-radio-group__items',
        children: list.map(item => {
          const val = String(getVal(item));
          const itemLabel = item?.label ?? val;
          const itemDisabled = disabled || item?.disabled;
          const checked = val === String(current);
          let inputEl, controlEl;

          const itemEl = el('label', {
            class: ['ui-radio', itemDisabled && 'disabled'],
            data: { state: checked ? 'checked' : 'unchecked' },
            children: [
              el('input', {
                type: 'radio',
                class: 'ui-radio__input',
                name, value: val, disabled: itemDisabled,
                checked,
                ref: e => inputEl = e,
                onChange: e => setValue(e.target.value, e)
              }),
              el('span', { 
                class: 'ui-radio__control ui-border',
                data: { uiCol: checked ? color : `sub-${color}` },
                ref: e => controlEl = e
              }),
              el('span', { class: 'ui-radio__label', text: itemLabel })
            ]
          });

          radios.push({ value: val, input: inputEl, control: controlEl, el: itemEl });
          return itemEl;
        })
      })
    ]
  });

  return withValue(root, () => current, v => setValue(v));
}
