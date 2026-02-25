import { el, col, row, getCallback, withValue, parseArgs, configToClasses, bemFactory, noSpellcheck, focusAfterRender } from '../dom.js'
import { button } from './button.js'
import { label as textLabel } from './text.js'
import { createValidationController, createCounterController } from './validation.js'
import './input.css'

const bem = bemFactory('input');
const parseLimitArgs = (minOrConfig, maxValue) => (
  minOrConfig && typeof minOrConfig === 'object' && !Array.isArray(minOrConfig)
    ? { min: minOrConfig.min, max: minOrConfig.max }
    : { min: minOrConfig, max: maxValue }
);

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
 * @param {boolean} [config.required] - Require input to have a value
 * @param {string|Object} [config.message] - Validation error message(s)
 * @param {Function} [config.onSubmit] - Called on Enter key with value (input only)
 * @param {string} [config.id] - Registers to dom.input[id] and dom[id]
 * @returns {HTMLDivElement} Input wrapper with .value getter/setter, .isValid(), and .setLimits()
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
    required,
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

  const isTextarea = rows && rows > 1;
  const isNumber = type === 'number';
  const submitCallback = !isTextarea && getCallback('onSubmit', rest, true);
  const cb = getCallback('onSubmit', rest);
  const userOnInput = getCallback('onInput', rest);
  const userOnChange = getCallback('onChange', rest);
  let wrapEl, inputEl, counterEl, messageEl, infoEl;
  let currentMin = min;
  let currentMax = max;

  const submit = () => cb?.call(inputEl, inputEl.value);

  const validation = createValidationController({
    validate,
    required,
    min: currentMin,
    max: currentMax,
    message,
    checkLength: !isNumber,
    getValue: () => inputEl?.value || '',
    setInvalid: (isInvalid) => wrapEl?.classList.toggle('invalid', isInvalid),
    setMessage: (text, visible) => {
      if (!messageEl) return;
      messageEl.textContent = text;
      messageEl.hidden = !visible;
    },
    onInvalidChange: (isInvalid) => {
      if (infoEl) infoEl.hidden = isInvalid;
    }
  });

  const counterController = createCounterController({
    min: currentMin,
    max: currentMax,
    checkLength: !isNumber,
    getValue: () => inputEl?.value || '',
    setCounter: counter
      ? (text, state) => {
          if (!counterEl) return;
          counterEl.textContent = text;
          counterEl.classList.remove('warn', 'error', 'ok');
          if (state) counterEl.classList.add(state);
        }
      : null
  });

  const onInput = (e) => {
    validation.clearManualError();
    wrapEl.classList.toggle('has-value', !!inputEl.value);
    if (validation.hasRules) validation.check();
    if (counter) counterController.update();
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
    if (currentMin != null) next = Math.max(currentMin, next);
    if (currentMax != null) next = Math.min(currentMax, next);
    inputEl.value = next;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const inputTag = isTextarea ? 'textarea' : 'input';
  const inputAttrs = isTextarea
    ? { rows, id, placeholder, attrs: { ...attrs, maxlength: clamp ? currentMax : undefined } }
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
            onBlur: isNumber && clamp
              ? () => {
                  const val = parseFloat(inputEl.value);
                  if (isNaN(val)) return;
                  if (currentMin != null && val < currentMin) inputEl.value = currentMin;
                  else if (currentMax != null && val > currentMax) inputEl.value = currentMax;
                }
              : undefined
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
          ref: (e) => { counterEl = e; counterController.update(); }
        })
      ])
    ]
  });

  root.input = inputEl;
  root.isValid = validation.check;
  root.error = validation.error;
  root.ok = validation.ok;
  root.setLimits = (minOrConfig, maxValue) => {
    const { min: nextMin, max: nextMax } = parseLimitArgs(minOrConfig, maxValue);

    if (nextMin !== undefined) currentMin = nextMin;
    if (nextMax !== undefined) currentMax = nextMax;

    validation.setLimits({ min: nextMin, max: nextMax });
    counterController.setLimits({ min: nextMin, max: nextMax });

    if (isTextarea && clamp && inputEl) {
      if (currentMax == null) inputEl.removeAttribute('maxlength');
      else inputEl.setAttribute('maxlength', String(currentMax));
    }

    validation.check();
    if (counter) counterController.update();
  };
  
  // Reset to initial state (pristine, no validation errors shown)
  root.reset = () => {
    inputEl.value = '';
    wrapEl.classList.remove('has-value');
    validation.reset();
    if (counter) counterController.reset();
  };
  
  return withValue(root, () => inputEl.value, (v) => { inputEl.value = v; onInput(); });
}
