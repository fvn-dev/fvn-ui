// Built-in validators shared across text-like components
const builtinValidators = {
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  url: (v) => !v || /^https?:\/\/.+/.test(v),
  phone: (v) => !v || /^(\+47|0047)?\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}$/.test(v.replace(/[\s-]/g, ' ').trim()),
};

const replaceMessageTokens = (text, replacements) => String(text).replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? '');

export function resolveValidator(validate) {
  if (typeof validate === 'function') return validate;
  if (typeof validate === 'string') return builtinValidators[validate] || null;
  return null;
}

export function resolveValidationMessage({ message, errorType, validate, min, max, length }) {
  if (!message || !errorType) return null;
  if (typeof message === 'string') return message;

  const fromErrorType = message[errorType];
  const fromValidateKey = errorType === 'validate' && typeof validate === 'string' ? message[validate] : null;
  const template = fromErrorType || fromValidateKey;
  if (!template) return null;

  return replaceMessageTokens(template, { min, max, length });
}

export function resolveCounterState({ length, min, max, checkLength = true }) {
  if (max != null && length > max) return 'error';
  if (checkLength && min != null && length > 0 && length < min) return 'error';
  if (max != null && length > max * 0.9) return 'warn';
  if (checkLength && min != null && length >= min) return 'ok';
  return null;
}

export function createCounterController({
  min,
  max,
  checkLength = true,
  getValue,
  setCounter
}) {
  let currentMin = min;
  let currentMax = max;

  const update = () => {
    if (!setCounter) return;
    const value = String(getValue?.() ?? '');
    const length = value.length;
    const text = currentMax != null ? `${length}/${currentMax}` : String(length);
    const state = resolveCounterState({ length, min: currentMin, max: currentMax, checkLength });
    setCounter(text, state);
  };

  const setLimits = ({ min: nextMin, max: nextMax } = {}) => {
    if (nextMin !== undefined) currentMin = nextMin;
    if (nextMax !== undefined) currentMax = nextMax;
  };

  return {
    update,
    reset: update,
    setLimits
  };
}

export function createValidationController({
  validate,
  required = false,
  min,
  max,
  message,
  checkLength = true,
  getValue,
  setInvalid,
  setMessage,
  onInvalidChange
}) {
  const validator = resolveValidator(validate);
  let currentMin = min;
  let currentMax = max;
  let manualError = false;
  const hasRules = () => !!(required || validator || (checkLength && (currentMin != null || currentMax != null)));

  const apply = ({ errorType = null, manualMessage } = {}) => {
    const value = String(getValue?.() ?? '');
    const isInvalid = !!errorType;
    setInvalid?.(isInvalid);

    if (setMessage) {
      const msg = manualMessage != null
        ? manualMessage
        : (isInvalid ? resolveValidationMessage({ message, errorType, validate, min: currentMin, max: currentMax, length: value.length }) : null);
      setMessage(msg || '', !!msg);
    }

    onInvalidChange?.(isInvalid);
    return !isInvalid;
  };

  const getErrorType = () => {
    const value = String(getValue?.() ?? '');
    if (required && value.length === 0) return 'required';
    if (validator && !validator(value)) return 'validate';
    if (checkLength && currentMin != null && value.length < currentMin) return 'min';
    if (checkLength && currentMax != null && value.length > currentMax) return 'max';
    return null;
  };

  const check = () => {
    manualError = false;
    return apply({ errorType: getErrorType() });
  };

  const clearManualError = () => {
    if (!manualError) return;
    manualError = false;
    apply();
  };

  const error = (msg) => {
    manualError = true;
    setInvalid?.(true);
    if (msg != null) setMessage?.(msg, !!msg);
    onInvalidChange?.(true);
  };

  const ok = () => {
    manualError = false;
    apply();
  };

  const reset = () => {
    manualError = false;
    apply();
  };

  const setLimits = ({ min: nextMin, max: nextMax } = {}) => {
    if (nextMin !== undefined) currentMin = nextMin;
    if (nextMax !== undefined) currentMax = nextMax;
  };

  const api = {
    check,
    clearManualError,
    error,
    ok,
    reset,
    setLimits
  };

  Object.defineProperty(api, 'hasRules', {
    enumerable: true,
    get: hasRules
  });

  return api;
}
