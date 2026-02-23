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
  const update = () => {
    if (!setCounter) return;
    const value = String(getValue?.() ?? '');
    const length = value.length;
    const text = max != null ? `${length}/${max}` : String(length);
    const state = resolveCounterState({ length, min, max, checkLength });
    setCounter(text, state);
  };

  return {
    update,
    reset: update
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
  const hasRules = !!(required || validator || (checkLength && (min != null || max != null)));
  let manualError = false;

  const apply = ({ errorType = null, manualMessage } = {}) => {
    const value = String(getValue?.() ?? '');
    const isInvalid = !!errorType;
    setInvalid?.(isInvalid);

    if (setMessage) {
      const msg = manualMessage != null
        ? manualMessage
        : (isInvalid ? resolveValidationMessage({ message, errorType, validate, min, max, length: value.length }) : null);
      setMessage(msg || '', !!msg);
    }

    onInvalidChange?.(isInvalid);
    return !isInvalid;
  };

  const getErrorType = () => {
    const value = String(getValue?.() ?? '');
    if (required && value.length === 0) return 'required';
    if (validator && !validator(value)) return 'validate';
    if (checkLength && min != null && value.length < min) return 'min';
    if (checkLength && max != null && value.length > max) return 'max';
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

  return {
    hasRules,
    check,
    clearManualError,
    error,
    ok,
    reset
  };
}
