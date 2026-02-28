import { el, row, col, parseArgs, configToClasses, bemFactory, noSpellcheck, focusAfterRender } from '../dom.js'
import { label as textLabel } from './text.js'
import { createValidationController, createCounterController } from './validation.js'
import './editable.css'

const bem = bemFactory('editable');
let prosemirrorAdapterPromise;
const SKIP_VALIDATION_EVENT_PROP = '__fvnSkipValidation';
const USER_INTERACTION_EVENT_PROP = '__fvnUserInteraction';

const parseLimitArgs = (minOrConfig, maxValue) => (
  minOrConfig && typeof minOrConfig === 'object' && !Array.isArray(minOrConfig)
    ? { min: minOrConfig.min, max: minOrConfig.max }
    : { min: minOrConfig, max: maxValue }
);

const loadProseMirrorAdapter = () => {
  if (!prosemirrorAdapterPromise) {
    prosemirrorAdapterPromise = import('./editable.prosemirror.js');
  }
  return prosemirrorAdapterPromise;
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const fallbackMarkdownToHtml = (markdown = '') => String(markdown || '')
  .split(/\n{2,}/)
  .map((block) => `<span data-ui-paragraph>${escapeHtml(block).replace(/\n/g, '<br>')}</span>`)
  .join('');

const fallbackHtmlToMarkdown = (html = '') => {
  const root = document.createElement('div');
  root.innerHTML = html;
  return (root.textContent || '').trim();
};

/**
 * Creates a editable element with input-like behavior
 * @param {Object} config
 * @param {string} [config.label] - Label text
 * @param {string} [config.placeholder] - Placeholder text (shown when empty)
 * @param {string} [config.value] - Initial HTML content
 * @param {'default'|'large'} [config.size='default'] - Size variant
 * @param {number} [config.rows] - 1 = single line, > 1 = multiline (sets min-height)
 * @param {string} [config.richRuntimeBaseUrl='https://esm.sh'] - Base URL for rich runtime CDN modules (rich mode only)
 * @param {boolean} [config.multiline=true] - Allow multiple lines (false = single line)
 * @param {boolean} [config.plainText=false] - Strip formatting on paste
 * @param {'email'|'url'|'phone'|Function} [config.validate] - Validation rule or custom function
 * @param {number} [config.min] - Minimum character length
 * @param {number} [config.max] - Maximum character length
 * @param {boolean} [config.counter] - Show character counter
 * @param {boolean} [config.required] - Require text content
 * @param {string|Object} [config.message] - Validation error message(s)
 * @param {string} [config.info] - Helper text shown when valid
 * @param {Function} [config.onChange] - Called on input with (html, event)
 * @param {Function} [config.onInput] - Called on every input with (html, event)
 * @param {Function} [config.onFocus] - Called on focus with (event)
 * @param {Function} [config.onBlur] - Called on blur with (html, event)
 * @param {Function} [config.onKeydown] - Called on keydown with (event)
 * @param {Function} [config.onSubmit] - Called on Enter key with (html, event) - single line mode only
 * @param {string} [config.id] - Registers to dom.editable[id] and dom[id]
 * @returns {HTMLDivElement} Wrapper with .value/.html/.text/.markdown getters, .isValid(), .setLimits(), .toText(), .toMarkdown(), and .fromMarkdown()
 */
export function editable(...args) {
  const {
    parent,
    id,
    size = 'default',
    label,
    placeholder = '...',
    value,
    rows,
    rich = false,
    richRuntimeBaseUrl,
    richInclude,
    richExclude,
    multiline,
    plainText = false,
    plain = false,
    validate,
    required,
    min,
    max,
    counter,
    message,
    info,
    focus,
    onChange,
    onInput,
    onFocus,
    onBlur,
    onKeydown,
    onSubmit,
    props,
    attrs = {},
    ...rest
  } = parseArgs(...args);

  const isSingleLine = rows === 1 || multiline === false;
  const minRows = rows && rows > 1 ? rows : null;

  let editableEl;
  let messageEl;
  let infoEl;
  let counterEl;
  let richApi = null;
  let currentMin = min;
  let currentMax = max;
  let hasInteracted = false;

  const getHtml = () => richApi?.getHTML?.() ?? (editableEl?.innerHTML || '');

  const getText = () => {
    const probe = document.createElement('div');
    probe.innerHTML = getHtml();
    return probe.textContent || '';
  };

  const getMarkdown = () => richApi?.toMarkdown?.() ?? fallbackHtmlToMarkdown(getHtml());

  const applyValidationState = ({ force = false } = {}) => {
    if ((force || hasInteracted) && validation.hasRules) validation.check();
    if (counter) counterController.update();
  };

  const emitCallbacks = (target, event, htmlValue = getHtml()) => {
    const source = target || editableEl;
    const e = event || new Event('input', { bubbles: true });
    onInput?.call(source, htmlValue, e);
    onChange?.call(source, htmlValue, e);
  };

  const validation = createValidationController({
    validate,
    required,
    min: currentMin,
    max: currentMax,
    message,
    checkLength: true,
    getValue: getText,
    setInvalid: (isInvalid) => {
      editableEl?.classList.toggle('invalid', isInvalid);
      richApi?.setInvalid?.(isInvalid);
    },
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
    checkLength: true,
    getValue: getText,
    setCounter: counter
      ? (text, state) => {
          if (!counterEl) return;
          counterEl.textContent = text;
          counterEl.classList.remove('warn', 'error', 'ok');
          if (state) counterEl.classList.add(state);
        }
      : null
  });

  const normalizePlainContent = () => {
    if (!editableEl || richApi?.isReady?.()) return;
    if (!editableEl.textContent.trim()) {
      editableEl.innerHTML = '';
    }
  };

  const handleInput = (e) => {
    if (richApi?.isReady?.()) return;
    hasInteracted = true;
    validation.clearManualError();
    normalizePlainContent();
    applyValidationState();
    emitCallbacks(e.target || editableEl, e);
  };

  const handleKeydown = (e) => {
    if (richApi?.isReady?.()) return;
    onKeydown?.call(editableEl, e);

    if (isSingleLine && e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.call(editableEl, getHtml(), e);
    }
  };

  const handlePaste = (e) => {
    if (richApi?.isReady?.()) return;
    if (plainText || isSingleLine) {
      e.preventDefault();
      let text = e.clipboardData.getData('text/plain');
      if (isSingleLine) text = text.replace(/[\r\n]+/g, ' ');
      document.execCommand('insertText', false, text);
    }
  };

  const handleFocus = (e) => {
    if (richApi?.isReady?.()) return;
    if (plain && editableEl.textContent) {
      const range = document.createRange();
      range.selectNodeContents(editableEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    onFocus?.call(editableEl, e);
  };

  const handleBlur = (e) => {
    if (richApi?.isReady?.()) return;
    normalizePlainContent();
    onBlur?.call(editableEl, getHtml(), e);
  };

  const editableDiv = el('div', {
    ...rest,
    ...attrs,
    ...noSpellcheck,
    id,
    contentEditable: 'true',
    data: { placeholder },
    style: minRows ? { minHeight: `${minRows * 1.5}em` } : undefined,
    class: [
      bem(),
      plain && 'ui-plain',
      bem.core('size', size),
      rich && bem('rich'),
      isSingleLine && bem('single-line'),
      'ui-border',
      rest.class
    ],
    ref: (node) => {
      editableEl = node;
      if (value) node.innerHTML = value;
      if (focus) focusAfterRender(node);
    },
    onInput: handleInput,
    onKeydown: handleKeydown,
    onPaste: handlePaste,
    onFocus: handleFocus,
    onBlur: handleBlur
  });

  const root = col(parent, {
    class: [bem.el('wrap'), configToClasses(props)],
    children: [
      label && textLabel({ text: label, soft: true }),
      editableDiv,
      (message || info || counter) && row({ class: bem.el('footer'), justify: 'between' }, [
        message && el('div', {
          class: bem.el('message'),
          hidden: true,
          ref: (node) => { messageEl = node; }
        }),
        info && el('div', {
          class: bem.el('info'),
          text: info,
          ref: (node) => { infoEl = node; }
        }),
        counter && el('div', {
          class: bem.el('counter'),
          end: true,
          ref: (node) => {
            counterEl = node;
            counterController.update();
          }
        })
      ])
    ]
  });

  const setHtml = (nextHtml) => {
    const valueHtml = String(nextHtml || '');
    if (richApi?.setHTML) {
      richApi.setHTML(valueHtml);
    } else {
      editableEl.innerHTML = valueHtml;
      normalizePlainContent();
    }
  };

  const setText = (nextText) => {
    const valueText = String(nextText || '');
    if (richApi?.setText) {
      richApi.setText(valueText);
      return;
    }
    editableEl.textContent = valueText;
    normalizePlainContent();
  };

  Object.defineProperty(root, 'value', {
    get: getText,
    set: (v) => {
      setText(v);
      validation.clearManualError();
      applyValidationState();
    }
  });

  Object.defineProperty(root, 'html', {
    get: getHtml,
    set: (v) => {
      setHtml(v);
      validation.clearManualError();
      applyValidationState();
    }
  });

  Object.defineProperty(root, 'text', {
    get: getText,
    set: (v) => {
      setText(v);
      validation.clearManualError();
      applyValidationState();
    }
  });

  Object.defineProperty(root, 'markdown', {
    get: getMarkdown,
    set: (v) => {
      root.fromMarkdown(v);
    }
  });

  root.isValid = validation.check;
  root.error = validation.error;
  root.ok = validation.ok;
  root.toText = () => getText();
  root.toMarkdown = () => getMarkdown();
  root.fromMarkdown = (markdown) => {
    const md = String(markdown || '');
    if (richApi?.fromMarkdown) {
      richApi.fromMarkdown(md);
    } else {
      setHtml(fallbackMarkdownToHtml(md));
    }
    validation.clearManualError();
    applyValidationState();
    return getHtml();
  };
  root.toggleMarkdownMode = (force) => richApi?.toggleMarkdownMode?.(force) ?? false;
  root.isMarkdownMode = () => richApi?.isMarkdownMode?.() ?? false;

  root.setLimits = (minOrConfig, maxValue) => {
    const { min: nextMin, max: nextMax } = parseLimitArgs(minOrConfig, maxValue);

    if (nextMin !== undefined) currentMin = nextMin;
    if (nextMax !== undefined) currentMax = nextMax;

    validation.setLimits({ min: nextMin, max: nextMax });
    counterController.setLimits({ min: nextMin, max: nextMax });
    richApi?.setLimits?.({ min: nextMin, max: nextMax });

    if (hasInteracted) validation.check();
    if (counter) counterController.update();
  };

  root.reset = () => {
    if (richApi?.reset) {
      richApi.reset();
    } else {
      editableEl.innerHTML = '';
      normalizePlainContent();
    }
    hasInteracted = false;
    validation.reset();
    if (counter) counterController.reset();
  };

  if (rich) {
    loadProseMirrorAdapter()
      .then(({ createProseMirrorAdapter }) => createProseMirrorAdapter({
        root,
        editableEl,
        placeholder,
        minRows,
        richRuntimeBaseUrl,
        richInclude,
        richExclude,
        plainText,
        validationConfig: {
          validate,
          required,
          message,
          min: currentMin,
          max: currentMax
        },
        bem,
        onHtmlInput: (html, target, event) => {
          const skipValidation = !!event?.[SKIP_VALIDATION_EVENT_PROP];
          const isUserInteraction = !!event?.isTrusted || !!event?.[USER_INTERACTION_EVENT_PROP];
          if (!skipValidation && isUserInteraction) {
            hasInteracted = true;
            validation.clearManualError();
            applyValidationState();
          }
          emitCallbacks(target, event, html);
        },
        onFocus: (target, event) => {
          onFocus?.call(target || editableEl, event);
        },
        onBlur: (target, event) => {
          onBlur?.call(target || editableEl, getHtml(), event);
        },
        onKeydown: (target, event) => {
          onKeydown?.call(target || editableEl, event);
          if (isSingleLine && event.key === 'Enter') {
            event.preventDefault();
            onSubmit?.call(target || editableEl, getHtml(), event);
          }
        },
        onReady: () => {
          if (counter) counterController.update();
        }
      }))
      .then((adapter) => {
        richApi = adapter;
      })
      .catch((err) => {
        console.warn('[fvn-ui/editable] failed to load rich editor runtime', err);
      });
  }

  return root;
}
