import { el, getCallback, withValue, parseArgs, propsToClasses } from '../dom.js'
import { button } from './button.js'
import './input.css'

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
    props = {},
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

  const root = el('div', parent, {
    class: ['flex', 'flex-col', 'gap-2', propsToClasses(props), rest.class],
    children: [
      label && el('div', { class: 'ui-label ui-label--soft', text: label }),
      el('div', {
        class: ['ui-input-wrap', `ui-size--${size}`],
        ref: (e) => wrapEl = e,
        children: [
          el('input', {
            class: 'ui-input ui-border',
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
