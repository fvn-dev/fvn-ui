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
 * @param {string|Object} [config.message] - Validation error message(s)
 * @param {Function} [config.onSubmit] - Called on Enter key with value (input only)
 * @param {string} [config.id] - Registers to dom.input[id] and dom[id]
 * @returns {HTMLDivElement} Input wrapper with .value getter/setter and .isValid()
 * @example
 * input({ label: 'Email', validate: 'email' })
 * input({ label: 'Bio', rows: 4, counter: true, max: 500 })
 * input({ label: 'Email', validate: 'email', message: 'Ugyldig e-post' })
 * input({ validate: 'email', min: 10, message: { validate: 'Ugyldig e-post', min: 'Minimum {min} tegn' } })
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
    step = 1,
    clamp,
    counter,
    message,
    info,
    attrs = {},
    props,
    ...rest
  } = parseArgs(...args);

  const isTextarea = rows != null;
  const isNumber = type === 'number';
  const cb = getCallback('onSubmit', rest);
  const submitCallback = !isTextarea && getCallback('onSubmit', rest, true);
  const userOnInput = getCallback('onInput', rest);
  const userOnChange = getCallback('onChange', rest);
  let wrapEl, inputEl, counterEl, messageEl, infoEl;

  const submit = () => cb?.call(inputEl, inputEl.value);

  // Get message for a specific error type
  const getMessage = (errorType) => {
    if (!message) return null;
    if (typeof message === 'string') return message;
    // Support both generic 'validate' key and specific validator name (e.g., 'email')
    const msg = message[errorType] || (errorType === 'validate' && typeof validate === 'string' && message[validate]);
    if (!msg) return null;
    return msg.replace('{min}', min).replace('{max}', max).replace('{length}', inputEl?.value?.length || 0);
  };

  // Validation
  const getValidator = () => {
    if (typeof validate === 'function') return validate;
    if (typeof validate === 'string') return validators[validate];
    return null;
  };

  const checkValid = () => {
    const v = inputEl.value;
    const validator = getValidator();
    let errorType = null;
    
    if (validator && !validator(v)) errorType = 'validate';
    // Only check length-based min/max for non-number inputs
    else if (!isNumber && min != null && v.length < min) errorType = 'min';
    else if (!isNumber && max != null && v.length > max) errorType = 'max';
    
    const isInvalid = errorType && v.length > 0;
    wrapEl.classList.toggle('invalid', isInvalid);
    
    // Update message (validation wins over info)
    if (messageEl) {
      const msg = isInvalid ? getMessage(errorType) : null;
      messageEl.textContent = msg || '';
      messageEl.hidden = !msg;
    }
    // Show/hide info based on validation state
    if (infoEl) {
      infoEl.hidden = isInvalid;
    }
    
    return !errorType;
  };

  // Counter update
  const updateCounter = () => {
    if (!counterEl) return;
    const len = inputEl.value.length;
    counterEl.textContent = max ? `${len}/${max}` : len;
    
    // Color based on limits
    counterEl.classList.remove('warn', 'error', 'ok');
    if (max && len > max) counterEl.classList.add('error');
    else if (min && len > 0 && len < min) counterEl.classList.add('error');
    else if (max && len > max * 0.9) counterEl.classList.add('warn');
    else if (min && len >= min) counterEl.classList.add('ok');
  };

  const onInput = (e) => {
    wrapEl.classList.toggle('has-value', !!inputEl.value);
    if (validate || min != null || max != null) checkValid();
    if (counter) updateCounter();
    userOnInput?.call(inputEl, inputEl.value, e);
  };

  const onChange = (e) => {
    userOnChange?.call(inputEl, inputEl.value, e);
  };

  const onKeyup = (e) => {
    if (e.key === 'Enter') submit();
  };

  // Number input increment/decrement
  const adjustNumber = (delta) => {
    const current = parseFloat(inputEl.value) || 0;
    let next = current + delta * step;
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    inputEl.value = next;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const inputTag = isTextarea ? 'textarea' : 'input';
  const inputAttrs = isTextarea
    ? { rows, id, placeholder, attrs: { ...attrs, maxlength: clamp ? max : undefined } }
    : { type, id, value, placeholder, attrs };

  const root = col(parent, {
    gap: 2,
    class: ['ui-input-root', configToClasses(props), rest.class],
    children: [
      label && textLabel({ text: label, soft: true }),
      el('div', {
        class: [bem.el('wrap'), bem.core('size', size), isNumber && bem.el('wrap--number')],
        ref: (e) => wrapEl = e,
        children: [
          el(inputTag, {
            ...rest,
            ...inputAttrs,
            ...noSpellcheck,
            class: [bem(), submitCallback && bem('submit'), isNumber && bem('number'), 'ui-border', rest.class],
            ref: (e) => {
              inputEl = e;
              if (isTextarea && value) e.textContent = value;
              if (focus) focusAfterRender(e);
            },
            onInput,
            onChange: userOnChange ? onChange : undefined,
            onKeyup: cb && onKeyup,
            onBlur: isNumber && clamp ? () => {
              const val = parseFloat(inputEl.value);
              if (isNaN(val)) return;
              if (min != null && val < min) inputEl.value = min;
              else if (max != null && val > max) inputEl.value = max;
            } : undefined
          }),
          isNumber && el('div', {
            class: bem.el('num-btns'),
            children: [
              button({
                icon: 'minus',
                muted: true,
                variant: 'ghost',
                size,
                class: bem.el('num-btn'),
                attrs: { 'aria-label': 'Decrease', tabindex: -1 },
                onClick: () => adjustNumber(-1)
              }),
              button({
                icon: 'plus',
                muted: true,
                variant: 'ghost',
                size,
                class: bem.el('num-btn'),
                attrs: { 'aria-label': 'Increase', tabindex: -1 },
                onClick: () => adjustNumber(1)
              })
            ]
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
      (message || info || counter) && row({ class: bem.el('footer'), justify: 'between' }, [
        message && el('div', {
          class: bem.el('message'),
          hidden: true,
          ref: (e) => messageEl = e
        }),
        info && el('div', {
          class: bem.el('info'),
          text: info,
          ref: (e) => infoEl = e
        }),
        isTextarea && counter && el('div', {
          class: bem.el('counter'),
          end: true,
          ref: (e) => { counterEl = e; updateCounter(); }
        })
      ])
    ]
  });

  root.input = inputEl;
  root.isValid = checkValid;
  
  // Manual validation control
  root.error = (msg) => {
    wrapEl.classList.add('invalid');
    if (messageEl && msg) {
      messageEl.textContent = msg;
      messageEl.hidden = false;
    }
  };
  root.ok = () => {
    wrapEl.classList.remove('invalid');
    if (messageEl) {
      messageEl.textContent = '';
      messageEl.hidden = true;
    }
  };
  
  return withValue(root, () => inputEl.value, (v) => { inputEl.value = v; onInput(); });
}
