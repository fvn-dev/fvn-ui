import { el, row, col, parseArgs, configToClasses, bemFactory, noSpellcheck, focusAfterRender } from '../dom.js'
import { button } from './button.js'
import { dialog } from './dialog.js'
import { input } from './input.js'
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
      if (rich) {
        const first = editableEl.firstElementChild;
        const keepSingleBlock = editableEl.childElementCount === 1
          && first
          && /^(H[1-6]|P|DIV)$/i.test(first.tagName);

        if (keepSingleBlock) {
          if (!first.innerHTML || first.innerHTML === '&nbsp;') {
            first.innerHTML = '<br>';
          }
          return;
        }
      }
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
      rich && bem('rich'),
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
    addRichTextUI(root, editableDiv, richInclude, richExclude);
  }

  return root;
}

// ---> rich text editor

function addRichTextUI(root, editableEl, richInclude, richExclude) {
  editableEl.setAttribute('role', 'textbox');
  editableEl.setAttribute('aria-multiline', 'true');

  const available = ['heading', 'bold', 'italic', 'list', 'link', 'clear'];
  let applied = Array.isArray(richInclude) 
    ? available.filter((option) => richInclude.includes(option))
    : available;

  if (Array.isArray(richExclude)) { 
    applied = applied.filter((option) => !richExclude.includes(option));
  }

  // Toolbar
  const toolbar = row({ gap: 1, class: bem.el('toolbar') });
  toolbar.setAttribute('role', 'toolbar');
  root.insertBefore(toolbar, editableEl);

  // --- Selection save/restore (for dialogs like link prompt) ---
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

  const queryState = (command) => {
    try {
      return !!document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  const getSelectionNode = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node = sel.getRangeAt(0).commonAncestorContainer;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    if (!node || !editableEl.contains(node)) return null;
    return node;
  };

  const hasAncestorTag = (node, tags) => {
    let current = node;
    while (current && current !== editableEl) {
      if (current.tagName && tags.includes(current.tagName.toLowerCase())) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  };

  const unwrapNode = (node) => {
    if (!node?.parentNode) return;
    while (node.firstChild) {
      node.parentNode.insertBefore(node.firstChild, node);
    }
    node.remove();
  };

  const isBlockTag = (tagName = '') => /^(H[1-6]|P|DIV|UL|OL|BLOCKQUOTE|PRE|TABLE)$/i.test(tagName);

  const replaceTag = (element, tagName) => {
    const replacement = document.createElement(tagName);
    while (element.firstChild) {
      replacement.appendChild(element.firstChild);
    }
    element.replaceWith(replacement);
    return replacement;
  };

  const setCaretInBlock = (element, atEnd = true) => {
    if (!element) return;
    focusEditor();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();

    const hasOnlyBreak = element.childNodes.length === 1 && element.firstChild?.nodeName === 'BR';
    if (hasOnlyBreak) {
      // Place caret before <br> so first keystroke stays in this block.
      range.setStart(element, 0);
      range.collapse(true);
    } else {
      range.selectNodeContents(element);
      range.collapse(!atEnd);
    }

    sel.removeAllRanges();
    sel.addRange(range);
  };

  const stripFormattingStyles = (styleText = '') => styleText
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .filter((rule) => !/^font-weight\s*:/i.test(rule) && !/^font-style\s*:/i.test(rule))
    .join('; ');

  const normalizeRichMarkup = () => {
    // Flatten duplicated inline formatting wrappers generated by repeated toggles.
    editableEl.querySelectorAll('b b, b strong, strong b, strong strong, i i, i em, em i, em em').forEach(unwrapNode);

    editableEl.querySelectorAll('span[style], b[style], i[style], strong[style], em[style]').forEach((node) => {
      const style = node.getAttribute('style') || '';
      const hasBoldStyle = /font-weight\s*:\s*(bold|[6-9]00)/i.test(style);
      const hasItalicStyle = /font-style\s*:\s*italic/i.test(style);

      if (node.tagName === 'SPAN' && hasBoldStyle && !hasAncestorTag(node, ['b', 'strong'])) {
        const b = document.createElement('b');
        node.replaceWith(b);
        b.appendChild(node);
      }

      if (node.tagName === 'SPAN' && hasItalicStyle && !hasAncestorTag(node, ['i', 'em'])) {
        const i = document.createElement('i');
        node.replaceWith(i);
        i.appendChild(node);
      }

      const nextStyle = stripFormattingStyles(style);
      if (nextStyle) node.setAttribute('style', nextStyle);
      else node.removeAttribute('style');
    });

    // Remove invalid heading containers (e.g. h3 wrapping block elements)
    editableEl.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((headingEl) => {
      if (headingEl.querySelector('h1, h2, h3, h4, h5, h6, p, div, ul, ol, blockquote, pre, table')) {
        replaceTag(headingEl, 'div');
      }
    });

    // Unwrap empty spans introduced by browser formatting
    editableEl.querySelectorAll('span').forEach((spanEl) => {
      if (spanEl.attributes.length > 0) return;
      while (spanEl.firstChild) {
        spanEl.parentNode.insertBefore(spanEl.firstChild, spanEl);
      }
      spanEl.remove();
    });

    editableEl.querySelectorAll('b, strong, i, em').forEach((inlineEl) => {
      const hasText = !!inlineEl.textContent?.trim();
      const hasBr = !!inlineEl.querySelector?.('br');
      if (!hasText && !hasBr) inlineEl.remove();
    });
  };

  const isBoldActive = () => {
    const node = getSelectionNode();
    const commandState = queryState('bold');
    if (!commandState) return false;

    // In heading blocks, browser command state can report bold because of UA styles.
    // Keep heading and bold as independent toggles.
    if (node && hasAncestorTag(node, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) && !hasAncestorTag(node, ['b', 'strong'])) {
      return false;
    }

    return true;
  };

  const isItalicActive = () => {
    return queryState('italic');
  };

  const getSelectedLink = () => {
    const node = getSelectionNode();
    return node?.closest?.('a') || null;
  };

  // --- Command execution ---
  // execCommand is deprecated but still the simplest cross-browser method for 'minimal UI'
  const exec = (command, value = null) => {
    if (!isSelectionInEditor()) {
      focusEditor();
      restoreSelection();
    }
    try {
      document.execCommand('styleWithCSS', false, false);
    } catch {}
    document.execCommand(command, false, value);
    normalizeRichMarkup();
    saveSelection();
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

  const getCurrentBlock = () => {
    try {
      const cmdValue = document.queryCommandValue('formatBlock');
      const norm = String(cmdValue || '').replace(/[<>]/g, '').toLowerCase();
      if (norm) return norm === 'div' ? 'p' : norm;
    } catch {}

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 'p';
    let node = sel.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    if (!editableEl.contains(node)) return 'p';
    const block = node.closest?.('h1,h2,h3,h4,h5,h6,p,div');
    const tag = (block?.tagName || 'p').toLowerCase();
    return tag === 'div' ? 'p' : tag;
  };

  const getCurrentBlockElement = () => {
    const node = getSelectionNode();
    if (!node) return null;
    const block = node.closest?.('h1, h2, h3, h4, h5, h6, p, div');
    if (!block || block === editableEl) return null;
    return block;
  };

  const createBlockAtCaret = (tagName = 'div') => {
    const blockEl = document.createElement(tagName);
    blockEl.appendChild(document.createElement('br'));

    // Empty editor: insert a fresh block so user can toggle heading before typing
    if (!editableEl.textContent.trim() && editableEl.children.length <= 1) {
      editableEl.innerHTML = '';
      editableEl.appendChild(blockEl);
      setCaretInBlock(blockEl, false);
      return blockEl;
    }

    // Fallback: append block and move caret into it
    editableEl.appendChild(blockEl);
    setCaretInBlock(blockEl, false);
    return blockEl;
  };

  const createSiblingBlock = (afterEl, tagName = 'div') => {
    const blockEl = document.createElement(tagName);
    blockEl.appendChild(document.createElement('br'));
    afterEl.insertAdjacentElement('afterend', blockEl);
    setCaretInBlock(blockEl, false);
    return blockEl;
  };

  const isCollapsedSelection = () => {
    const sel = window.getSelection();
    return !!(sel && sel.rangeCount && sel.getRangeAt(0).collapsed);
  };

  const makeButton = ({ option, icon, onClick, isActive }) => {
    const isMandatory = applied.length && option === 'clear';
    if (!isMandatory && !applied.includes(option)) {
      return;
    }
    const btn = button({
      icon,
      variant: 'ghost',
      class: ['rte-btn', bem.el('rte-btn')],
      attrs: { 'aria-pressed': 'false' }
    });
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => {
      if (!isSelectionInEditor()) focusEditor();
      restoreSelection();
      onClick();
      saveSelection();
    });

    btn._rteIsActive = isActive ?? (() => false);
    return btn;
  };

  // --- Buttons ---
  const buttons = [];

  buttons.push(
    makeButton({
      option: 'heading',
      icon: 'heading',
      onClick: () => {
        let blockEl = getCurrentBlockElement();
        if (!blockEl) blockEl = createBlockAtCaret('div');
        const current = blockEl.tagName.toLowerCase();
        const nextTag = current === 'h3' ? 'div' : 'h3';

        const hasText = !!blockEl.textContent.trim();
        const hasDirectChildBlocks = [...blockEl.children].some((child) => isBlockTag(child.tagName));
        if (isCollapsedSelection() && (hasText || hasDirectChildBlocks)) {
          const sibling = createSiblingBlock(blockEl, nextTag);
          normalizeRichMarkup();
          saveSelection();
          updateActiveStates();
          editableEl.dispatchEvent(new Event('input', { bubbles: true }));
          return sibling;
        }

        const replaced = replaceTag(blockEl, nextTag);
        normalizeRichMarkup();
        setCaretInBlock(replaced, false);
        saveSelection();
        updateActiveStates();
        editableEl.dispatchEvent(new Event('input', { bubbles: true }));
      },
      isActive: () => getCurrentBlock() === 'h3',
    }),
    makeButton({
      option: 'bold',
      icon: 'bold',
      onClick: () => toggleInlineCommand('bold', isBoldActive, 'b,strong'),
      isActive: isBoldActive,
    }),
    makeButton({
      option: 'italic',
      icon: 'italic',
      onClick: () => toggleInlineCommand('italic', isItalicActive, 'i,em'),
      isActive: isItalicActive,
    }),
    makeButton({
      option: 'list',
      icon: 'list',
      onClick: () => exec('insertUnorderedList'),
      isActive: () => queryState('insertUnorderedList'),
    }),
    makeButton({
      option: 'list',
      icon: 'list-ordered',
      onClick: () => exec('insertOrderedList'),
      isActive: () => queryState('insertOrderedList'),
    })
  );

  // Link button (simple prompt)
  let linkTooltip;
  let linkInput;
  let applyLinkBtn;

  const normalizeUrl = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  };

  const applyLinkFromTooltip = () => {
    const normalized = normalizeUrl(linkInput?.value);
    if (!normalized) {
      linkInput?.error?.('URL is required');
      return;
    }

    try {
      new URL(normalized);
    } catch {
      linkInput?.error?.('Invalid URL');
      return;
    }

    restoreSelection();

    // If selection is collapsed, create link text
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      if (r.collapsed) {
        const textNode = document.createTextNode(normalized);
        r.insertNode(textNode);
        r.setStartBefore(textNode);
        r.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }

    exec('createLink', normalized);
    linkTooltip?.hide();
  };

  const buildLinkTooltip = (anchorEl) => {
    linkInput = input({
      label: 'Link URL',
      placeholder: 'https://example.com',
      onInput: () => linkInput.ok?.(),
      onSubmit: () => applyLinkFromTooltip()
    });

    applyLinkBtn = button({
      label: 'Apply',
      variant: 'outline',
      onClick: () => applyLinkFromTooltip()
    });

    const cancelBtn = button({
      label: 'Cancel',
      variant: 'ghost',
      onClick: () => linkTooltip?.hide()
    });

    const content = col({
      gap: 2,
      children: [
        linkInput,
        row({ gap: 2, end: true }, [cancelBtn, applyLinkBtn])
      ]
    });

    return dialog({
      type: 'tooltip',
      class: bem.el('tooltip'),
      anchor: anchorEl,
      position: 'bottom',
      content,
      onOpen: () => {
        const selectedLink = getSelectedLink();
        linkInput.value = selectedLink?.getAttribute('href') || '';
        linkInput.ok?.();
        setTimeout(() => linkInput.input?.focus(), 0);
      }
    });
  };

  const linkBtn = makeButton({
    option: 'link',
    icon: 'link',
    onClick: () => {
      saveSelection();
      if (!linkTooltip) linkTooltip = buildLinkTooltip(linkBtn);
      if (linkTooltip.isOpen) {
        linkTooltip.hide();
        return;
      }
      linkTooltip.show(linkBtn);
    },
    isActive: () => queryState('createLink'),
  });

  const unlinkBtn = makeButton({
    option: 'link',
    icon: 'unlink',
    onClick: () => exec('unlink'),
  });

  const clearBtn = makeButton({
    option: 'clear',
    icon: 'remove-formatting',
    onClick: () => {
      exec('removeFormat');
      exec('unlink');
    },
  });

  // Append toolbar elements
  row(toolbar, [...buttons, linkBtn, unlinkBtn, clearBtn], { end: true, gap: 0 });

  const forceCaretOutOfInline = (selectors) => {
    const node = getSelectionNode();
    const inlineEl = node?.closest?.(selectors);
    if (!inlineEl || !editableEl.contains(inlineEl)) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    const range = document.createRange();
    range.setStartAfter(inlineEl);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    saveSelection();
    return true;
  };

  const toggleInlineCommand = (command, isActive, selectors) => {
    exec(command);
    if (!isCollapsedSelection()) return;
    if (isActive()) {
      // Some browser states remain "sticky" inside nested inline tags.
      // Move caret out so next typing is unformatted.
      if (forceCaretOutOfInline(selectors)) {
        updateActiveStates();
        editableEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  // --- Active state updates ---
  const updateActiveStates = () => {
    // Buttons active state
    const allButtons = toolbar.querySelectorAll('.rte-btn');
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
  editableEl.addEventListener('input', normalizeRichMarkup);
  editableEl.addEventListener('input', updateActiveStates);
  editableEl.addEventListener('focus', updateActiveStates);
  editableEl.addEventListener('keyup', updateActiveStates);
  editableEl.addEventListener('mouseup', updateActiveStates);
  const onRichKeydown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || !isSelectionInEditor()) return;
    requestAnimationFrame(() => {
      let changed = false;
      try {
        if (isBoldActive()) {
          document.execCommand('bold', false, null);
          changed = true;
        }
        if (isItalicActive()) {
          document.execCommand('italic', false, null);
          changed = true;
        }
      } catch {}
      if (changed) {
        updateActiveStates();
        editableEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  };
  editableEl.addEventListener('keydown', onRichKeydown);

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
      editableEl.removeEventListener('keydown', onRichKeydown);
      linkTooltip?.destroy?.();
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
