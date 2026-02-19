import { el, col, row, getCallback, withValue, parseArgs, configToClasses, bemFactory, noSpellcheck, focusAfterRender } from '../dom.js'
import { button } from './button.js'
import { label as textLabel } from './text.js'
import './input.css'

const bem = bemFactory('input');

// Built-in validators
const validators = {
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  url: (v) => !v || /^https?:\/\/.+/.test(v),
  phone: (v) => !v || /^(\+47|0047)?\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}$/.test(v.replace(/[\s-]/g, ' ').trim()),
};

/**
 * Creates a text input or textarea with optional label and submit handling
 * @param {Object} config
 * @param {string} [config.label] - Input label
 * @param {string} [config.placeholder] - Placeholder text
 * @param {string} [config.value] - Initial value
 * @param {'text'|'email'|'password'|'number'} [config.type='text'] - Input type
 * @param {'default'|'large'} [config.size='default'] - Input size
 * @param {number} [config.rows] - If set, renders a textarea with this many rows
 * @param {'email'|'url'|'phone'|Function} [config.validate] - Validation rule or custom function
 * @param {number} [config.min] - Minimum length (also used for counter color)
 * @param {number} [config.max] - Maximum length (also used for counter color)
 * @param {boolean} [config.counter] - Show character counter (textarea only)
 * @param {Function} [config.onSubmit] - Called on Enter key with value (input only)
 * @param {string} [config.id] - Registers to dom.input[id] and dom[id]
 * @returns {HTMLDivElement} Input wrapper with .value getter/setter and .isValid()
 * @example
 * input({ label: 'Email', validate: 'email' })
 * input({ label: 'Bio', rows: 4, counter: true, max: 500 })
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
    focus,
    validate,
    min,
    max,
    counter,
    attrs = {},
    props,
    ...rest
  } = parseArgs(...args);

  const isTextarea = rows != null;
  const cb = getCallback('onSubmit', rest);
  const submitCallback = !isTextarea && getCallback('onSubmit', rest, true);
  let wrapEl, inputEl, counterEl;

  const submit = () => cb?.call(inputEl, inputEl.value);

  // Validation
  const getValidator = () => {
    if (typeof validate === 'function') return validate;
    if (typeof validate === 'string') return validators[validate];
    return null;
  };

  const checkValid = () => {
    const v = inputEl.value;
    const validator = getValidator();
    let valid = true;
    
    if (validator && !validator(v)) valid = false;
    if (min != null && v.length < min) valid = false;
    if (max != null && v.length > max) valid = false;
    
    wrapEl.classList.toggle('invalid', !valid && v.length > 0);
    return valid;
  };

  // Counter update
  const updateCounter = () => {
    if (!counterEl) return;
    const len = inputEl.value.length;
    counterEl.textContent = max ? `${len}/${max}` : len;
    
    // Color based on limits
    counterEl.classList.remove('warn', 'error', 'ok');
    if (max && len > max) counterEl.classList.add('error');
    else if (max && len > max * 0.9) counterEl.classList.add('warn');
    else if (min && len >= min) counterEl.classList.add('ok');
  };

  const onInput = () => {
    wrapEl.classList.toggle('has-value', !!inputEl.value);
    if (validate || min != null || max != null) checkValid();
    if (counter) updateCounter();
  };

  const onKeyup = (e) => {
    if (e.key === 'Enter') submit();
  };

  const inputTag = isTextarea ? 'textarea' : 'input';
  const inputAttrs = isTextarea
    ? { rows, id, placeholder, attrs }
    : { type, id, value, placeholder, attrs };

  const root = col(parent, {
    gap: 2,
    class: ['ui-input-root', configToClasses(props), rest.class],
    children: [
      label && textLabel({ text: label, soft: true }),
      el('div', {
        class: [bem.el('wrap'), bem.core('size', size)],
        ref: (e) => wrapEl = e,
        children: [
          el(inputTag, {
            ...rest,
            ...inputAttrs,
            ...noSpellcheck,
            class: [bem(), submitCallback && bem('submit'), 'ui-border', rest.class],
            ref: (e) => {
              inputEl = e;
              if (isTextarea && value) e.textContent = value;
              if (focus) focusAfterRender(e);
            },
            onInput,
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
      }),
      isTextarea && counter && el('div', {
        class: bem.el('counter'),
        ref: (e) => { counterEl = e; updateCounter(); }
      })
    ]
  });

  root.input = inputEl;
  root.isValid = checkValid;
  return withValue(root, () => inputEl.value, (v) => { inputEl.value = v; onInput(); });
}
