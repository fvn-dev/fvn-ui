import { el, col, parseArgs, configToClasses, bemFactory, noSpellcheck } from '../dom.js'
import { label as textLabel } from './text.js'
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
 * @param {Function} [config.onChange] - Called on input with { value, html, element }
 * @param {Function} [config.onInput] - Called on every input event
 * @param {Function} [config.onFocus] - Called on focus
 * @param {Function} [config.onBlur] - Called on blur
 * @param {Function} [config.onKeydown] - Called on keydown
 * @param {Function} [config.onSubmit] - Called on Enter key (single line mode)
 * @param {string} [config.id] - Registers to dom.editable[id] and dom[id]
 * @returns {HTMLDivElement} Wrapper with .value getter/setter for text content
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
    multiline,
    plainText = false,
    plain = false,
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

  let editableEl;

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

  const handleInput = (e) => {
    normalizeContent();
    const payload = { value: getValue(), html: getHtml(), element: editableEl, event: e };
    onInput?.call(editableEl, payload);
    onChange?.call(editableEl, payload);
  };

  const handleKeydown = (e) => {
    onKeydown?.call(editableEl, e);
    
    // Single line: prevent Enter from creating new lines
    if (isSingleLine && e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.call(editableEl, { value: getValue(), html: getHtml(), element: editableEl, event: e });
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
    onBlur?.call(editableEl, { value: getValue(), html: getHtml(), element: editableEl, event: e });
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
      editableDiv
    ]
  });

  Object.defineProperty(root, 'value', {
    get: getValue,
    set: (v) => {
      editableEl.innerHTML = v || '';
      normalizeContent();
    }
  });

  Object.defineProperty(root, 'html', {
    get: getHtml,
    set: (v) => {
      editableEl.innerHTML = v || '';
      normalizeContent();
    }
  });

  return root;
}
