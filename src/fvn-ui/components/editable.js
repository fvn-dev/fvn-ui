import { el, row, col, parseArgs, configToClasses, bemFactory, noSpellcheck, focusAfterRender } from '../dom.js';
import { label as textLabel } from './text.js';
import { button } from './button.js';
import { dialog } from './dialog.js';
import { input } from './input.js';
import { createValidationController, createCounterController } from './validation.js';
import withRichText from './editable.rich.js';
import './editable.css';

const bem = bemFactory('editable');
const MARKED_CDN_URL = 'https://cdn.jsdelivr.net/npm/marked@17.0.3/lib/marked.umd.min.js';
const TURNDOWN_CDN_URL = 'https://cdn.jsdelivr.net/npm/turndown@7.1.2/dist/turndown.js';
const runtimeLoaders = new Map();

const parseLimitArgs = (minOrConfig, maxValue) => (
  minOrConfig && typeof minOrConfig === 'object' && !Array.isArray(minOrConfig)
    ? { min: minOrConfig.min, max: minOrConfig.max }
    : { min: minOrConfig, max: maxValue }
);

const htmlToText = (html = '') => {
  const probe = document.createElement('div');
  probe.innerHTML = String(html || '');
  return probe.textContent || '';
};

const prettifyLabel = (value) => (
  String(value || '')
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
);

const normalizeLinkUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
};

const sanitizePastedText = (value, { singleLine = false } = {}) => {
  const raw = String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\\n/g, '\n');

  const probe = document.createElement('div');
  probe.innerHTML = raw;
  let text = probe.textContent || '';

  if (singleLine) {
    text = text.replace(/[\r\n]+/g, ' ');
  }

  return text;
};

const loadRuntimeScript = (name, src, readGlobal) => {
  const existingRuntime = readGlobal();
  if (existingRuntime) return Promise.resolve(existingRuntime);
  if (runtimeLoaders.has(name)) return runtimeLoaders.get(name);

  const promise = new Promise((resolve, reject) => {
    const onResolve = () => {
      const runtime = readGlobal();
      if (runtime) {
        resolve(runtime);
        return;
      }
      reject(new Error(`[fvn-ui/editable] "${name}" loaded but global runtime was missing`));
    };

    const onReject = () => reject(new Error(`[fvn-ui/editable] failed to load "${name}" runtime`));

    let script = document.querySelector(`script[data-fvn-editable-lib="${name}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.fvnEditableLib = name;
      script.addEventListener('load', () => {
        script.dataset.fvnEditableReady = 'true';
        onResolve();
      }, { once: true });
      script.addEventListener('error', onReject, { once: true });
      document.head.appendChild(script);
      return;
    }

    script.addEventListener('load', onResolve, { once: true });
    script.addEventListener('error', onReject, { once: true });
    if (script.dataset.fvnEditableReady === 'true') onResolve();
  });

  runtimeLoaders.set(name, promise);
  promise.catch(() => runtimeLoaders.delete(name));
  return promise;
};

const loadMarked = () => loadRuntimeScript('marked', MARKED_CDN_URL, () => globalThis.marked || null);
const loadTurndown = () => loadRuntimeScript('turndown', TURNDOWN_CDN_URL, () => globalThis.TurndownService || null);

const convertMarkdownToHtml = async (markdown = '') => {
  const markedRuntime = await loadMarked();
  const parser = typeof markedRuntime?.parse === 'function'
    ? markedRuntime.parse.bind(markedRuntime)
    : typeof markedRuntime?.marked?.parse === 'function'
      ? markedRuntime.marked.parse.bind(markedRuntime.marked)
      : null;

  if (!parser) {
    throw new Error('[fvn-ui/editable] marked runtime did not expose parse(...)');
  }

  return String(parser(String(markdown || '')) || '');
};

const convertHtmlToMarkdown = async (html = '') => {
  const TurndownService = await loadTurndown();
  const service = new TurndownService({ strongDelimiter: '*' });
  service.addRule('slackLinks', {
    filter: 'a',
    replacement: function (content, node) {
      const href = node.getAttribute('href')
      if (!href) return content
      return `<${href}|${content}>`
    }
  });
  return service.turndown(String(html || ''));
};

/**
 * Creates a editable element with input-like behavior
 * @param {Object} config
 * @param {string} [config.label] - Label text
 * @param {string} [config.placeholder] - Placeholder text (shown when empty)
 * @param {string} [config.value] - Initial content
 * @param {'default'|'large'} [config.size='default'] - Size variant
 * @param {number} [config.rows] - 1 = single line, > 1 = multiline (sets min-height)
 * @param {boolean} [config.multiline=true] - Allow multiple lines (false = single line)
 * @param {boolean} [config.rich=false] - Enable rich text editing
 * @param {boolean} [config.plainText=false] - Strip formatting on paste in contenteditable mode
 * @param {'email'|'url'|'phone'|Function} [config.validate] - Validation rule or custom function
 * @param {number} [config.min] - Minimum character length
 * @param {number} [config.max] - Maximum character length
 * @param {boolean} [config.counter] - Show character counter
 * @param {boolean} [config.required] - Require text content
 * @param {string|Object} [config.message] - Validation error message(s)
 * @param {string} [config.info] - Helper text shown when valid
 * @param {Function} [config.onChange] - Called on input with (value, event)
 * @param {Function} [config.onInput] - Called on every input with (value, event)
 * @param {Function} [config.onFocus] - Called on focus with (event)
 * @param {Function} [config.onBlur] - Called on blur with (value, event)
 * @param {Function} [config.onKeydown] - Called on keydown with (event)
 * @param {Function} [config.onSubmit] - Called on Enter key with (value, event) - single line mode only
 * @param {string} [config.id] - Registers to dom.editable[id] and dom[id]
 * @returns {HTMLDivElement}
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
    contrast,
    attrs = {},
    ...rest
  } = parseArgs(...args);

  const isSingleLine = rows === 1 || multiline === false;
  const minRows = rows && rows > 1 ? rows : null;
  const markdownRows = Math.max(minRows || 6, 4);

  const state = {
    mode: rich ? 'rich' : 'plain',
    hasInteracted: false,
    currentMin: min,
    currentMax: max,
    modeToken: 0,
    editableEl: null,
    markdownEl: null,
    richController: null,
    richState: {
      bold: false,
      italic: false,
      heading: false,
      list: false,
      link: false,
      href: null,
      quote: false
    },
    linkDialog: null,
    linkInput: null,
    toolbarButtons: new Map()
  };

  const isMarkdownMode = () => rich && state.mode === 'markdown';
  const getRichHtml = () => state.editableEl?.innerHTML || '';
  const getCurrentValue = () => (isMarkdownMode() ? state.markdownEl?.value || '' : getRichHtml());
  const getValidationValue = () => (isMarkdownMode() ? state.markdownEl?.value || '' : htmlToText(getRichHtml()));

  const syncRichEmptyState = () => {
    if (!rich || !state.editableEl) return;
    if (isMarkdownMode()) {
      state.editableEl.dataset.empty = 'false';
      return;
    }
    state.editableEl.dataset.empty = getValidationValue().trim().length === 0 ? 'true' : 'false';
  };

  const normalizePlainContent = () => {
    if (rich || !state.editableEl) return;
    if (!state.editableEl.textContent?.trim()) {
      state.editableEl.innerHTML = '';
    }
  };

  const emitValue = (event, target) => {
    const source = target || (isMarkdownMode() ? state.markdownEl : state.editableEl);
    const payload = getCurrentValue();
    const e = event || new Event('input', { bubbles: true });
    onInput?.call(source, payload, e);
    onChange?.call(source, payload, e);
  };

  let messageEl;
  let infoEl;
  let counterEl;

  const validation = createValidationController({
    validate,
    required,
    min: state.currentMin,
    max: state.currentMax,
    message,
    checkLength: true,
    getValue: getValidationValue,
    setInvalid: (isInvalid) => {
      state.editableEl?.classList.toggle('invalid', isInvalid);
      state.markdownEl?.classList.toggle('invalid', isInvalid);
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
    min: state.currentMin,
    max: state.currentMax,
    checkLength: true,
    getValue: getValidationValue,
    setCounter: counter
      ? (text, variant) => {
          if (!counterEl) return;
          counterEl.textContent = text;
          counterEl.classList.remove('warn', 'error', 'ok');
          if (variant) counterEl.classList.add(variant);
        }
      : null
  });

  const applyValidation = ({ force = false } = {}) => {
    if ((force || state.hasInteracted) && validation.hasRules) validation.check();
    if (counter) counterController.update();
    syncRichEmptyState();
  };

  const setCurrentValue = (nextValue) => {
    const next = String(nextValue || '');
    if (isMarkdownMode()) {
      if (state.markdownEl) state.markdownEl.value = next;
      return;
    }

    if (state.editableEl) {
      state.editableEl.innerHTML = next;
      if (!rich) normalizePlainContent();
      syncRichEmptyState();
    }
  };

  const updateToolbarState = () => {
    if (!rich) return;
    const markdown = isMarkdownMode();

    state.toolbarButtons.forEach((entry) => {
      const { btn, action } = entry;
      const disabled = action.key !== 'markdown' && markdown;
      btn.disabled = disabled;
      const active = !disabled && action.active();
      btn.classList.toggle('is-active', !!active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  const setMarkdownMode = async (force) => {
    if (!rich || !state.markdownEl || !state.editableEl) return false;

    const nextMode = typeof force === 'boolean'
      ? (force ? 'markdown' : 'rich')
      : (isMarkdownMode() ? 'rich' : 'markdown');

    if (nextMode === state.mode) return isMarkdownMode();
    const token = ++state.modeToken;

    try {
      if (nextMode === 'markdown') {
        state.linkDialog?.hide?.();
        const markdown = await convertHtmlToMarkdown(state.editableEl.innerHTML || '');
        if (token !== state.modeToken) return isMarkdownMode();

        const richHeight = state.editableEl.offsetHeight;
        if (richHeight > 0) {
          state.markdownEl.style.height = `${richHeight}px`;
        }
        state.markdownEl.value = markdown;
        state.mode = 'markdown';
        state.editableEl.hidden = true;
        state.markdownEl.hidden = false;
        updateToolbarState();
        applyValidation();
        focusAfterRender(state.markdownEl);
        return true;
      }

      const html = await convertMarkdownToHtml(state.markdownEl.value || '');
      if (token !== state.modeToken) return isMarkdownMode();

      state.editableEl.innerHTML = html;
      state.markdownEl.style.height = '';
      state.mode = 'rich';
      state.markdownEl.hidden = true;
      state.editableEl.hidden = false;
      state.richController?.resume?.();
      syncRichEmptyState();
      updateToolbarState();
      applyValidation();
      return false;
    } catch (error) {
      console.warn('[fvn-ui/editable] failed to toggle markdown mode', error);
      return isMarkdownMode();
    }
  };

  const applyLink = () => {
    const nextUrl = normalizeLinkUrl(state.linkInput?.value || '');
    if (!nextUrl) {
      state.richController?.toggle('link', null);
      state.linkDialog?.hide?.();
      return;
    }

    try {
      // Validate absolute URL before applying.
      new URL(nextUrl);
    } catch {
      state.linkInput?.error?.('Invalid URL');
      return;
    }

    state.richController?.toggle('link', nextUrl);
    state.linkDialog?.hide?.();
  };

  const ensureLinkDialog = (anchorEl) => {
    if (state.linkDialog) return state.linkDialog;

    const linkField = input({
      placeholder: 'https://example.com',
      onInput: () => linkField.ok?.(),
      callback: () => applyLink()
    });

    const cancelBtn = button({
      label: 'Cancel',
      variant: 'ghost',
      size: 'small',
      onClick: () => state.linkDialog?.hide?.()
    });

    const applyBtn = button({
      label: 'Apply',
      variant: 'outline',
      size: 'small',
      onClick: () => applyLink()
    });

    const removeBtn = button({
      label: 'Remove',
      color: 'red',
      size: 'small',
      start: true,
      onClick: () => {
        linkField.value = '';
        applyLink();
      }
    });    

    state.linkInput = linkField;
    state.linkDialog = dialog({
      type: 'tooltip',
      class: bem.el('tooltip'),
      small: true,
      anchor: anchorEl,
      position: 'bottom',
      content: col({
        gap: 2,
        children: [
          linkField,
          row({ gap: 2, end: true }, [removeBtn, cancelBtn, applyBtn])
        ]
      }),
      onOpen: () => {
        const { href } = state.richController?.getState?.() || {};
        linkField.value = href || '';
        removeBtn.style.display = href ? '' : 'none';
        linkField.ok?.();
        setTimeout(() => linkField.input?.focus(), 0);
      }
    });

    return state.linkDialog;
  };

  const toolbarActions = rich
    ? [
        {
          key: 'heading',
          icon: 'heading',
          active: () => !!state.richState.heading,
          run: () => state.richController?.toggle('heading')
        },
        {
          key: 'bold',
          icon: 'bold',
          active: () => !!state.richState.bold,
          run: () => state.richController?.toggle('bold')
        },
        {
          key: 'italic',
          icon: 'italic',
          active: () => !!state.richState.italic,
          run: () => state.richController?.toggle('italic')
        },
        {
          key: 'quote',
          icon: 'quote',
          active: () => !!state.richState.quote,
          run: () => state.richController?.toggle('quote')
        },
        {
          key: 'list',
          icon: 'list',
          active: () => !!state.richState.list,
          run: () => state.richController?.toggle('list')
        },
        {
          key: 'link',
          icon: 'link',
          active: () => !!state.richState.link,
          run: (btn) => {
            const tip = ensureLinkDialog(btn);
            if (tip.isOpen) {
              tip.hide();
              return;
            }
            tip.show(btn);
          }
        },
        {
          key: 'markdown',
          icon: 'code',
          active: () => isMarkdownMode(),
          run: () => setMarkdownMode()
        }
      ]
    : [];

  const toolbar = rich
    ? row({
      class: bem.el('toolbar'),
      gap: 0,
      align: 'center',
      children: toolbarActions.map((action) => {
        const btn = button({
          icon: action.icon,
          tip: prettifyLabel(action.key),
          variant: 'ghost',
          attrs: { 'aria-pressed': 'false' }
        });
        btn.addEventListener('mousedown', (event) => event.preventDefault());
        btn.addEventListener('click', async (event) => {
          event.preventDefault();
          if (btn.disabled) return;
          await action.run(btn);
          updateToolbarState();
        });
        state.toolbarButtons.set(action.key, { btn, action });
        return btn;
      })
    })
    : null;

  if (toolbar) {
    toolbar.setAttribute('role', 'toolbar');
  }

  const handleContentInput = (event) => {
    if (isMarkdownMode()) return;
    state.hasInteracted = true;
    validation.clearManualError();
    normalizePlainContent();
    applyValidation();
    emitValue(event, state.editableEl);
  };

  const handleMarkdownInput = (event) => {
    if (!isMarkdownMode()) return;
    state.hasInteracted = true;
    validation.clearManualError();
    applyValidation();
    emitValue(event, state.markdownEl);
  };

  const handleContentKeydown = (event) => {
    if (isMarkdownMode()) return;
    onKeydown?.call(state.editableEl, event);

    if (isSingleLine && event.key === 'Enter') {
      event.preventDefault();
      onSubmit?.call(state.editableEl, getCurrentValue(), event);
    }
  };

  const handleMarkdownKeydown = (event) => {
    if (!isMarkdownMode()) return;
    onKeydown?.call(state.markdownEl, event);

    if (isSingleLine && event.key === 'Enter') {
      event.preventDefault();
      onSubmit?.call(state.markdownEl, getCurrentValue(), event);
    }
  };

  const handleContentPaste = (event) => {
    if (isMarkdownMode()) return;

    event.preventDefault();
    const clipboardText = event.clipboardData?.getData('text/plain')
      || event.clipboardData?.getData('text/html')
      || '';
    const text = sanitizePastedText(clipboardText, { singleLine: isSingleLine || plainText });
    document.execCommand('insertText', false, text);
  };

  const handleMarkdownPaste = (event) => {
    if (!isMarkdownMode() || !state.markdownEl) return;

    event.preventDefault();
    const clipboardText = event.clipboardData?.getData('text/plain')
      || event.clipboardData?.getData('text/html')
      || '';
    const text = sanitizePastedText(clipboardText, { singleLine: isSingleLine });
    const { selectionStart, selectionEnd } = state.markdownEl;
    state.markdownEl.setRangeText(text, selectionStart, selectionEnd, 'end');
    state.markdownEl.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const handleContentFocus = (event) => {
    if (isMarkdownMode()) return;
    if (plain && state.editableEl?.textContent) {
      const range = document.createRange();
      range.selectNodeContents(state.editableEl);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    onFocus?.call(state.editableEl, event);
  };

  const handleMarkdownFocus = (event) => {
    if (!isMarkdownMode()) return;
    onFocus?.call(state.markdownEl, event);
  };

  const handleContentBlur = (event) => {
    if (isMarkdownMode()) return;
    normalizePlainContent();
    onBlur?.call(state.editableEl, getCurrentValue(), event);
  };

  const handleMarkdownBlur = (event) => {
    if (!isMarkdownMode()) return;
    onBlur?.call(state.markdownEl, getCurrentValue(), event);
  };

  const editableEl = el('div', {
    ...rest,
    ...attrs,
    ...noSpellcheck,
    id,
    contentEditable: 'true',
    data: { placeholder },
    style: minRows ? { minHeight: `${minRows * 1.5}em` } : undefined,
    class: [
      bem(),
      bem.el('editor'),
      plain && 'ui-plain',
      bem.core('size', size),
      rich && bem('rich'),
      isSingleLine && bem('single-line'),      
      rest.class
    ],
    ref: (node) => {
      state.editableEl = node;
      if (value != null) node.innerHTML = String(value);
      if (focus) focusAfterRender(node);
    },
    onInput: handleContentInput,
    onKeydown: handleContentKeydown,
    onPaste: handleContentPaste,
    onFocus: handleContentFocus,
    onBlur: handleContentBlur
  });

  const markdownEl = rich
    ? el('textarea', {
      ...noSpellcheck,
      class: [bem.el('markdown'), bem.el('editor'), bem.core('size', size)],
      rows: markdownRows,
      placeholder,
      hidden: true,
      style: minRows ? { minHeight: `${minRows * 1.5}em` } : undefined,
      ref: (node) => {
        state.markdownEl = node;
      },
      onInput: handleMarkdownInput,
      onPaste: handleMarkdownPaste,
      onKeydown: handleMarkdownKeydown,
      onFocus: handleMarkdownFocus,
      onBlur: handleMarkdownBlur
    })
    : null;

  const root = col(parent, {
    class: [bem.el('wrap'), configToClasses(props)],
    children: [
      label && textLabel({ text: label, soft: !contrast }),
      col({ class: [ bem.el('content'), 'ui-border', contrast && 'ui-contrast' ] }, [
        editableEl,
        markdownEl,
        toolbar
      ]),
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

  if (rich && state.editableEl) {
    state.richController = withRichText(state.editableEl);
    state.richController.listen((nextState) => {
      state.richState = nextState;
      updateToolbarState();
    });
  }

  syncRichEmptyState();
  updateToolbarState();

  Object.defineProperty(root, 'value', {
    get: getCurrentValue,
    set: (nextValue) => {
      setCurrentValue(nextValue);
      validation.clearManualError();
      applyValidation();
    }
  });

  root.isValid = validation.check;
  root.error = validation.error;
  root.ok = validation.ok;
  root.toggleMarkdownMode = (force) => setMarkdownMode(force);
  root.toMarkdown = async () => (isMarkdownMode() ? state.markdownEl?.value || '' : convertHtmlToMarkdown(getRichHtml()));
  root.toHTML = async () => (isMarkdownMode() ? convertMarkdownToHtml(state.markdownEl?.value || '') : getRichHtml());

  root.setLimits = (minOrConfig, maxValue) => {
    const { min: nextMin, max: nextMax } = parseLimitArgs(minOrConfig, maxValue);
    if (nextMin !== undefined) state.currentMin = nextMin;
    if (nextMax !== undefined) state.currentMax = nextMax;

    validation.setLimits({ min: nextMin, max: nextMax });
    counterController.setLimits({ min: nextMin, max: nextMax });

    if (state.hasInteracted) validation.check();
    if (counter) counterController.update();
  };

  root.reset = () => {
    if (state.editableEl) state.editableEl.innerHTML = '';
    if (state.markdownEl) state.markdownEl.value = '';
    state.hasInteracted = false;
    syncRichEmptyState();
    validation.reset();
    if (counter) counterController.reset();
    updateToolbarState();
  };

  return root;
}
