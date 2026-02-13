import { el, getCallback, withValue, parseArgs, configToClasses, bemFactory } from '../dom.js'
import { label as textLabel } from './text.js'
import './form.css'
import './radio.css'

const bem = bemFactory('radio');

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
 * radio({ value: 'apple', items: [{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }] })
 */
export function radio(...args) {
  const {
    parent,
    items = [],
    value,
    name = `radio-${Math.random().toString(36).slice(2, 7)}`,
    label,
    orientation,
    disabled,
    color = 'default',
    props,
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
    class: [bem(), 'ui-form-group', isRow && 'horizontal', configToClasses(props), rest.class],
    attrs: { role: 'radio' },
    children: [
      label && textLabel({ text: label, soft: true }),
      el('div', {
        class: 'ui-form-group__items',
        children: list.map(item => {
          const val = String(getVal(item));
          const itemLabel = item?.label ?? val;
          const itemDisabled = disabled || item?.disabled;
          const checked = val === String(current);
          let inputEl, controlEl;

          const itemEl = el('label', {
            class: ['ui-radio ui-form-item', itemDisabled && 'disabled'],
            data: { state: checked ? 'checked' : 'unchecked' },
            children: [
              el('input', {
                type: 'radio',
                class: 'ui-form-input',
                name, value: val, disabled: itemDisabled,
                checked,
                ref: e => inputEl = e,
                onChange: e => setValue(e.target.value, e)
              }),
              el('span', { 
                class: 'ui-form-control ui-form-control--round ui-border',
                data: { uiCol: checked ? color : `sub-${color}` },
                ref: e => controlEl = e
              }),
              textLabel({ text: itemLabel, small: true })
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
