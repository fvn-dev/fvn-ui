import { el, row, col, parseArgs, configToClasses, bemFactory, noSpellcheck, focusAfterRender } from '../dom.js'
import { button } from './button.js'
import { selectComponent } from './select.js'
import { label as textLabel } from './text.js'
import { createValidationController, createCounterController } from './validation.js'
import './editable.css'

const bem = bemFactory('editable');

/**
 * Creates a editable element with input-like behavior
 * @param {Object} config
 * @param {string} [config.label] - Label text
 * @param {string} [config.placeholder] - Placeholder text (shown when empty)
 * @param {string} [config.value] - Initial HTML content
 * @param {'default'|'large'} [config.size='default'] - Size variant
 * @param {number} [config.rows] - 1 = single line, > 1 = multiline (sets min-height)
 * @param {boolean} [config.multiline=true] - Allow multiple lines (false = single line)
 * @param {boolean} [config.plainText=false] - Strip formatting on paste
 * @param {'email'|'url'|'phone'|Function} [config.validate] - Validation rule or custom function
 * @param {number} [config.min] - Minimum character length
 * @param {number} [config.max] - Maximum character length
 * @param {boolean} [config.counter] - Show character counter
 * @param {boolean} [config.required] - Require text content
 * @param {string|Object} [config.message] - Validation error message(s)
 * @param {string} [config.info] - Helper text shown when valid
 * @param {Function} [config.onChange] - Called on input with (html, event) - use e.target.textContent for text
 * @param {Function} [config.onInput] - Called on every input with (html, event)
 * @param {Function} [config.onFocus] - Called on focus with (event)
 * @param {Function} [config.onBlur] - Called on blur with (html, event)
 * @param {Function} [config.onKeydown] - Called on keydown with (event)
 * @param {Function} [config.onSubmit] - Called on Enter key with (html, event) - single line mode only
 * @param {string} [config.id] - Registers to dom.editable[id] and dom[id]
 * @returns {HTMLDivElement} Wrapper with .value/.html getter-setters and .isValid()
 * @example
 * editable({ placeholder: 'Type here...' })  // multiline by default
 * editable({ label: 'Title', rows: 1, onSubmit: (e) => save(e.value) })  // single line
 * editable({ label: 'Bio', rows: 5 })  // multiline with min-height
 * editable({ multiline: false })  // same as rows: 1
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
    attrs = {},
    ...rest
  } = parseArgs(...args);

  // Determine single line mode: rows === 1 OR multiline === false
  const isSingleLine = rows === 1 || multiline === false;
  // Calculate min-height from rows (if > 1)
  const minRows = rows && rows > 1 ? rows : null;

  let editableEl, messageEl, infoEl, counterEl;

  // Normalize content - ensure there's always something to click
  const normalizeContent = () => {
    // If element only has whitespace or is empty, clear it completely
    // This ensures :empty pseudo-class works for placeholder
    if (!editableEl.textContent.trim()) {
      editableEl.innerHTML = '';
    }
  };

  const getValue = () => editableEl?.textContent || '';
  const getHtml = () => editableEl?.innerHTML || '';

  const counterController = createCounterController({
    min,
    max,
    checkLength: true,
    getValue,
    setCounter: counter
      ? (text, state) => {
          if (!counterEl) return;
          counterEl.textContent = text;
          counterEl.classList.remove('warn', 'error', 'ok');
          if (state) counterEl.classList.add(state);
        }
      : null
  });

  const validation = createValidationController({
    validate,
    required,
    min,
    max,
    message,
    checkLength: true,
    getValue,
    setInvalid: (isInvalid) => editableEl?.classList.toggle('invalid', isInvalid),
    setMessage: (text, visible) => {
      if (!messageEl) return;
      messageEl.textContent = text;
      messageEl.hidden = !visible;
    },
    onInvalidChange: (isInvalid) => {
      if (infoEl) infoEl.hidden = isInvalid;
    }
  });

  const handleInput = (e) => {
    validation.clearManualError();
    normalizeContent();
    if (validation.hasRules) validation.check();
    if (counter) counterController.update();
    const html = getHtml();
    onInput?.call(editableEl, html, e);
    onChange?.call(editableEl, html, e);
  };

  const handleKeydown = (e) => {
    onKeydown?.call(editableEl, e);
    
    // Single line: prevent Enter from creating new lines
    if (isSingleLine && e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.call(editableEl, getHtml(), e);
    }
  };

  const handlePaste = (e) => {
    if (plainText || isSingleLine) {
      e.preventDefault();
      let text = e.clipboardData.getData('text/plain');
      
      // Remove line breaks in single line mode
      if (isSingleLine) {
        text = text.replace(/[\r\n]+/g, ' ');
      }
      
      // Insert plain text at cursor
      document.execCommand('insertText', false, text);
    }
  };

  const handleFocus = (e) => {
    // In plain mode, select all text on focus
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
    normalizeContent();
    onBlur?.call(editableEl, getHtml(), e);
  };

  const editableDiv = el('div', {
    ...rest,
    ...attrs,
    ...noSpellcheck,
    id,
    contentEditable: 'true',
    data: {
      placeholder
    },
    style: minRows ? { minHeight: `${minRows * 1.5}em` } : undefined,
    class: [
      bem(),
      plain && 'ui-plain',
      bem.core('size', size),
      isSingleLine && bem('single-line'),
      'ui-border',
      rest.class
    ],
    ref: (e) => {
      editableEl = e;
      if (value) e.innerHTML = value;
      if (focus) focusAfterRender(e);
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
          ref: (e) => messageEl = e
        }),
        info && el('div', {
          class: bem.el('info'),
          text: info,
          ref: (e) => infoEl = e
        }),
        counter && el('div', {
          class: bem.el('counter'),
          end: true,
          ref: (e) => { counterEl = e; counterController.update(); }
        })
      ])
    ]
  });

  Object.defineProperty(root, 'value', {
    get: getValue,
    set: (v) => {
      editableEl.innerHTML = v || '';
      normalizeContent();
      validation.clearManualError();
      if (validation.hasRules) validation.check();
      if (counter) counterController.update();
    }
  });

  Object.defineProperty(root, 'html', {
    get: getHtml,
    set: (v) => {
      editableEl.innerHTML = v || '';
      normalizeContent();
      validation.clearManualError();
      if (validation.hasRules) validation.check();
      if (counter) counterController.update();
    }
  });

  root.isValid = validation.check;
  root.error = validation.error;
  root.ok = validation.ok;
  root.reset = () => {
    editableEl.innerHTML = '';
    normalizeContent();
    validation.reset();
    if (counter) counterController.reset();
  };

  if (rich) {
    addRichTextUI(root, editableDiv);
  }

  return root;
}

function addRichTextUI(root, editableEl) {
  editableEl.setAttribute('role', 'textbox');
  editableEl.setAttribute('aria-multiline', 'true');

  // Toolbar
  const toolbar = row({ gap: 1, class: bem.el('toolbar') });
  toolbar.setAttribute('role', 'toolbar');
  root.insertBefore(toolbar, editableEl);

  // --- Selection save/restore (for dialogs like link prompt) ---
  let isSyncingBlockSelect;
  let savedRange = null;

  const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!editableEl.contains(range.commonAncestorContainer)) return null;
    savedRange = range.cloneRange();
    return savedRange;
  };

  const restoreSelection = () => {
    if (!savedRange) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  };

  toolbar.addEventListener('pointerdown', () => {
    saveSelection(editableEl);
  }, true);

  const focusEditor = () => {
    editableEl.focus({ preventScroll: true });
  };

  // --- Command execution ---
  // execCommand is deprecated but still the simplest cross-browser method for 'minimal UI'
  const exec = (command, value = null) => {
    focusEditor();
    document.execCommand(command, false, value);
    updateActiveStates();
    editableEl.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // --- Helpers ---
  const isSelectionInEditor = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    return editableEl.contains(range.commonAncestorContainer);
  };

  const makeButton = ({ label: _label, icon, onClick, isActive }) => {
    const btn = button({ icon, variant: 'ghost' });
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => {
      if (!isSelectionInEditor()) focusEditor();
      onClick();
    });

    btn._rteIsActive = isActive ?? (() => false);
    return btn;
  };

  // --- Buttons ---
  const buttons = [];

  buttons.push(
    makeButton({
      label: 'B',
      icon: 'bold',
      onClick: () => exec('bold'),
      isActive: () => document.queryCommandState('bold'),
    }),
    makeButton({
      label: 'I',
      icon: 'italic',
      onClick: () => exec('italic'),
      isActive: () => document.queryCommandState('italic'),
    }),
    makeButton({
      label: '• List',
      icon: 'list',
      onClick: () => exec('insertUnorderedList'),
      isActive: () => document.queryCommandState('insertUnorderedList'),
    }),
    makeButton({
      label: '1. List',
      icon: 'list-ordered',
      onClick: () => exec('insertOrderedList'),
      isActive: () => document.queryCommandState('insertOrderedList'),
    })
  );

  const blockSelect = selectComponent({
    value: 'p',
    ghost: true,
    options: [
      { value: 'p', label: 'Paragraph' },
      { value: 'h3', label: 'Heading' }
    ],
    onchange: (value) => {
      if (isSyncingBlockSelect) return;

      editableEl.focus({ preventScroll: true });
      restoreSelection();

      exec('formatBlock', `<${value}>`);      
    }
  });

  //blockSelect.addEventListener('mousedown', (e) => e.preventDefault());
  toolbar.appendChild(blockSelect);

  // Link button (simple prompt)
  const linkBtn = makeButton({
    label: 'Link',
    icon: 'link',
    onClick: () => {
      saveSelection();
      const url = window.prompt('Enter URL (https://...)', 'https://');
      if (!url) return;
      restoreSelection();
      // If selection is collapsed, create link text
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0);
        if (r.collapsed) {
          const textNode = document.createTextNode(url);
          r.insertNode(textNode);
          // Select inserted text
          r.setStartBefore(textNode);
          r.setEndAfter(textNode);
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }
      exec('createLink', url);
    },
    isActive: () => document.queryCommandState('createLink'),
  });

  const unlinkBtn = makeButton({
    label: 'Unlink',
    icon: 'unlink',
    onClick: () => exec('unlink'),
  });

  const clearBtn = makeButton({
    label: 'Clear',
    icon: 'remove-formatting',
    onClick: () => {
      exec('removeFormat');
      exec('unlink');
    },
  });

  // Append toolbar elements
  row(toolbar, [...buttons, linkBtn, unlinkBtn, clearBtn], { end: true, gap: 0 });

  // --- Active state updates ---
  const updateActiveStates = () => {
    let block = 'p';

    try {
      const cmdValue = document.queryCommandValue('formatBlock');
      const norm = (cmdValue || '').replace(/[<>]/g, '').toLowerCase();
      if (['p', 'h3'].includes(norm)) {
        block = norm;
      }
    } catch {}

    // Prevent recursive onchange
    isSyncingBlockSelect = true;
    blockSelect.value = block;
    isSyncingBlockSelect = false;

    // Buttons active state
    const allButtons = toolbar.querySelectorAll('button.rte-btn');
    allButtons.forEach((btn) => {
      const active = typeof btn._rteIsActive === 'function' ? btn._rteIsActive() : false;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('is-active', !!active);
    });
  };

  // Update states on selection changes, input, focus
  const onSelectionChange = () => {
    if (!isSelectionInEditor()) return;
    updateActiveStates();
  };

  document.addEventListener('selectionchange', onSelectionChange);
  editableEl.addEventListener('input', updateActiveStates);
  editableEl.addEventListener('focus', updateActiveStates);
  editableEl.addEventListener('keyup', updateActiveStates);
  editableEl.addEventListener('mouseup', updateActiveStates);

  editableEl.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    exec('insertText', text);
  });

  // Initial state
  updateActiveStates();

  // Provide a cleanup + tiny API
  return {
    toolbar,
    destroy() {
      document.removeEventListener('selectionchange', onSelectionChange);
      toolbar.remove();
    },
    getHTML() {
      return editableEl.innerHTML;
    },
    setHTML(html) {
      editableEl.innerHTML = html || '<p><br></p>';
      updateActiveStates();
    },
    focus: focusEditor,
  };
}
