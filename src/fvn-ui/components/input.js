import { el, col, getCallback, withValue, parseArgs, configToClasses, bemFactory } from '../dom.js'
import { button } from './button.js'
import { label as textLabel } from './text.js'
import './input.css'

const bem = bemFactory('input');

/**
 * Creates a text input with optional label and submit handling
 * @param {Object} config
 * @param {string} [config.label] - Input label
 * @param {string} [config.placeholder] - Placeholder text
 * @param {string} [config.value] - Initial value
 * @param {'text'|'email'|'password'|'number'} [config.type='text'] - Input type
 * @param {'default'|'large'} [config.size='default'] - Input size
 * @param {Function} [config.onSubmit] - Called on Enter key with value
 * @param {string} [config.id] - Registers to dom.input[id] and dom[id]
 * @returns {HTMLDivElement} Input wrapper with .value getter/setter
 * @example
 * input({ label: 'Email', placeholder: 'you@example.com' })
 * input({ label: 'Search', onSubmit: (val) => search(val) })
 */
export function input(...args) {
  const {
    parent,
    id,
    type = 'text',
    size = 'default',
    icon,
    value,
    label,
    placeholder,
    attrs = {},
    ...rest
  } = parseArgs(...args);

  const cb = getCallback('onSubmit', rest);
  let wrapEl, inputEl;

  const submit = () => cb?.call(inputEl, inputEl.value);

  const onKeyup = (e) => {
    wrapEl.classList.toggle('has-value', !!inputEl.value);
    if (e.key === 'Enter') {
      submit();
    }
  };

  const root = col(parent, {
    gap: 2,
    class: [configToClasses(rest), rest.class],
    children: [
      label && textLabel({ text: label, soft: true }),
      el('div', {
        class: [bem.el('wrap'), bem.core('size', size)],
        ref: (e) => wrapEl = e,
        children: [
          el('input', {
            class: [bem(), 'ui-border'],
            type, id, value, placeholder, attrs,
            ref: (e) => inputEl = e,
            onKeyup: cb && onKeyup,
            ...rest
          }),
          cb && button({
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
