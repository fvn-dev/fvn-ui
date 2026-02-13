import { el, col, getCallback, withValue, parseArgs, configToClasses, bemFactory } from '../dom.js'
import { button } from './button.js'
import { label as textLabel } from './text.js'
import './input.css'

const bem = bemFactory('input');

/**
 * Creates a text input or textarea with optional label and submit handling
 * @param {Object} config
 * @param {string} [config.label] - Input label
 * @param {string} [config.placeholder] - Placeholder text
 * @param {string} [config.value] - Initial value
 * @param {'text'|'email'|'password'|'number'} [config.type='text'] - Input type
 * @param {'default'|'large'} [config.size='default'] - Input size
 * @param {number} [config.rows] - If set, renders a textarea with this many rows
 * @param {Function} [config.onSubmit] - Called on Enter key with value (input only)
 * @param {string} [config.id] - Registers to dom.input[id] and dom[id]
 * @returns {HTMLDivElement} Input wrapper with .value getter/setter
 * @example
 * input({ label: 'Email', placeholder: 'you@example.com' })
 * input({ label: 'Search', onSubmit: (val) => search(val) })
 * input({ label: 'Bio', rows: 4, placeholder: 'Tell us about yourself...' })
 */
export function input(...args) {
  const {
    parent,
    id,
    type = 'text',
    size = 'default',
    rows,
    icon,
    value,
    label,
    placeholder,
    attrs = {},
    props,
    ...rest
  } = parseArgs(...args);

  const isTextarea = rows != null;
  const cb = getCallback('onSubmit', rest);
  const submitCallback = !isTextarea && getCallback('onSubmit', rest, true);
  let wrapEl, inputEl;

  const submit = () => cb?.call(inputEl, inputEl.value);

  const onKeyup = (e) => {
    wrapEl.classList.toggle('has-value', !!inputEl.value);
    if (e.key === 'Enter') {
      submit();
    }
  };

  const inputTag = isTextarea ? 'textarea' : 'input';
  const inputAttrs = isTextarea
    ? { rows, id, placeholder, attrs }
    : { type, id, value, placeholder, attrs };

  const root = col(parent, {
    gap: 2,
    class: [configToClasses(props), rest.class],
    children: [
      label && textLabel({ text: label, soft: true }),
      el('div', {
        class: [bem.el('wrap'), bem.core('size', size)],
        ref: (e) => wrapEl = e,
        children: [
          el(inputTag, {
            ...rest,
            ...inputAttrs,
            class: [bem(), submitCallback && bem('submit'), 'ui-border', rest.class],
            ref: (e) => {
              inputEl = e;
              if (isTextarea && value) e.textContent = value;
            },
            onKeyup: cb && onKeyup
          }),
          submitCallback && button({
            icon: icon || 'enter',
            muted: true,
            variant: 'ghost',
            size,
            attrs: { 'aria-label': 'Submit' },
            onClick: submit
          })
        ]
      })
    ]
  });

  root.input = inputEl;
  return withValue(root, () => inputEl.value, (v) => { inputEl.value = v; });
}
