import { el, row, col, parseArgs, configToClasses, bemFactory, noSpellcheck, focusAfterRender } from '../dom.js'
import { button } from './button.js'
import { dialog } from './dialog.js'
import { input } from './input.js'
import { toggle } from './toggle.js'
import { label as textLabel } from './text.js'
import { createValidationController, createCounterController } from './validation.js'
import './editable.css'

const bem = bemFactory('editable');
const parseLimitArgs = (minOrConfig, maxValue) => (
  minOrConfig && typeof minOrConfig === 'object' && !Array.isArray(minOrConfig)
    ? { min: minOrConfig.min, max: minOrConfig.max }
    : { min: minOrConfig, max: maxValue }
);

const normalizeText = (value) => String(value || '').replace(/\u00a0/g, ' ');

const normalizeInlineBreaks = (value) => normalizeText(value)
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const escapeAttr = (value = '') => escapeHtml(value).replace(/`/g, '&#96;');

const renderInlineMarkdown = (value = '') => {
  let text = escapeHtml(value);
  const linkTokens = [];
  const storeLink = (href, label) => {
    const token = `@@LINK${linkTokens.length}@@`;
    linkTokens.push(`<a href="${escapeAttr(href)}">${escapeHtml(label.trim() || href)}</a>`);
    return token;
  };

  text = text.replace(/<((?:https?|mailto):[^|>\s]+)\|([^>]+)>/gi, (_, href, label) => storeLink(href, label));

  text = text.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_, label, href) => storeLink(href, label));

  text = text.replace(/(\*\*|__)([^*\n_][\s\S]*?)\1/g, '<strong>$2</strong>');
  text = text.replace(/(^|[^*])\*([^*\n][\s\S]*?)\*(?!\*)/g, '$1<strong>$2</strong>');
  text = text.replace(/~~([^~\n][\s\S]*?)~~/g, '<s>$1</s>');
  text = text.replace(/(^|[^~])~([^~\n][\s\S]*?)~(?!~)/g, '$1<s>$2</s>');
  text = text.replace(/(^|[^_])_([^_\n][\s\S]*?)_(?!_)/g, '$1<em>$2</em>');

  linkTokens.forEach((linkHtml, idx) => {
    text = text.split(`@@LINK${idx}@@`).join(linkHtml);
  });

  return text;
};

const toMarkdownFromHtml = (html = '', { slackFormat = false } = {}) => {
  const root = document.createElement('div');
  root.innerHTML = html;

  const formatLink = (text, href) => {
    const label = (text || href || '').trim();
    const url = String(href || '').trim();
    if (!url) return label;
    return slackFormat ? `<${url}|${label}>` : `[${label}](${url})`;
  };

  const renderInline = (node) => {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) return normalizeText(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag = node.tagName.toLowerCase();
    if (tag === 'br') return '\n';
    if (/^(h[1-6]|p|div|blockquote|pre|ul|ol|li|table)$/.test(tag)) {
      return normalizeText([...node.childNodes].map(renderInline).join(' '));
    }

    const inner = [...node.childNodes].map(renderInline).join('');
    if (tag === 'strike' || tag === 's' || tag === 'del') return inner.trim() ? `~${inner}~` : inner;
    if (tag === 'blockquote') return inner.trim() ? `> ${inner}` : inner;
    if (tag === 'strong' || tag === 'b') return inner.trim() ? `*${inner}*` : inner;
    if (tag === 'em' || tag === 'i') return inner.trim() ? `_${inner}_` : inner;
    if (tag === 'a') return formatLink(inner || node.textContent || node.getAttribute('href'), node.getAttribute('href'));
    return inner;
  };

  const isBlockNode = (node) => (
    node?.nodeType === Node.ELEMENT_NODE
    && /^(h[1-6]|p|div|blockquote|pre|ul|ol|li|table)$/.test(node.tagName.toLowerCase())
  );

  const renderList = (listEl) => [...listEl.children]
    .filter((child) => child.tagName?.toLowerCase() === 'li')
    .map((li) => {
      const text = normalizeInlineBreaks([...li.childNodes].map(renderInline).join(''));
      return text ? `- ${text.replace(/\n+/g, ' ')}` : '';
    })
    .filter(Boolean)
    .join('\n');

  const renderContainer = (node) => {
    const parts = [];
    let inlineBuffer = '';
    const flushInline = () => {
      const text = normalizeInlineBreaks(inlineBuffer);
      if (text) parts.push(text);
      inlineBuffer = '';
    };

    for (const child of node.childNodes) {
      if (isBlockNode(child)) {
        flushInline();
        const block = renderBlock(child);
        if (block) parts.push(block);
      } else {
        inlineBuffer += renderInline(child);
      }
    }

    flushInline();
    return parts.join('\n\n');
  };

  const renderBlock = (node) => {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) return normalizeInlineBreaks(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const text = normalizeInlineBreaks([...node.childNodes].map(renderInline).join('')).replace(/\n+/g, ' ');
      return text ? `## ${text}` : '';
    }
    if (tag === 'ul' || tag === 'ol') return renderList(node);
    if (tag === 'li') {
      const text = normalizeInlineBreaks([...node.childNodes].map(renderInline).join(''));
      return text ? `- ${text.replace(/\n+/g, ' ')}` : '';
    }
    if (tag === 'blockquote') {
      const text = normalizeInlineBreaks([...node.childNodes].map(renderInline).join('')).replace(/\n+/g, '\n> ');
      return text ? `> ${text}` : '';
    }
    return renderContainer(node);
  };

  return [...root.childNodes]
    .map(renderBlock)
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const toHtmlFromMarkdown = (markdown = '') => {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let paragraphLines = [];
  let quoteLines = [];
  let listLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const html = paragraphLines.map((line) => renderInlineMarkdown(line.trim())).join('<br>');
    blocks.push(`<div>${html || '<br>'}</div>`);
    paragraphLines = [];
  };

  const flushQuote = () => {
    if (!quoteLines.length) return;
    const html = quoteLines.map((line) => renderInlineMarkdown(line.trim())).join('<br>');
    blocks.push(`<blockquote>${html || '<br>'}</blockquote>`);
    quoteLines = [];
  };

  const flushList = () => {
    if (!listLines.length) return;
    const items = listLines
      .map((line) => `<li>${renderInlineMarkdown(line.trim())}</li>`)
      .join('');
    blocks.push(`<ul>${items}</ul>`);
    listLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const headingMatch = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    const listMatch = line.match(/^\s*[-*+]\s+(.+?)\s*$/);
    const quoteMatch = line.match(/^\s*>\s?(.*)$/);

    if (!trimmed) {
      flushParagraph();
      flushQuote();
      flushList();
      continue;
    }

    if (headingMatch) {
      flushParagraph();
      flushQuote();
      flushList();
      blocks.push(`<h3>${renderInlineMarkdown(headingMatch[2])}</h3>`);
      continue;
    }

    if (listMatch) {
      flushParagraph();
      flushQuote();
      listLines.push(listMatch[1]);
      continue;
    }

    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(quoteMatch[1]);
      continue;
    }

    flushQuote();
    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushQuote();
  flushList();

  return blocks.join('');
};

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
 * @returns {HTMLDivElement} Wrapper with .value/.html getter-setters, .isValid(), .setLimits(), .toMarkdown(), .toSlackMarkdown(), and .fromMarkdown()
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
  let richApi = null;
  let currentMin = min;
  let currentMax = max;

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

  const getMarkdownValue = () => (
    richApi?.isMarkdownMode?.()
      ? richApi.getMarkdown?.() ?? ''
      : null
  );

  const getValue = () => {
    const markdownValue = getMarkdownValue();
    if (markdownValue != null) return markdownValue;
    return editableEl?.textContent || '';
  };

  const getHtml = () => {
    const markdownValue = getMarkdownValue();
    if (markdownValue != null) return toHtmlFromMarkdown(markdownValue);
    return editableEl?.innerHTML || '';
  };

  const counterController = createCounterController({
    min: currentMin,
    max: currentMax,
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
    min: currentMin,
    max: currentMax,
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
    onInput?.call(e.target || editableEl, html, e);
    onChange?.call(e.target || editableEl, html, e);
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
      const nextHtml = v || '';
      editableEl.innerHTML = nextHtml;
      if (richApi?.isMarkdownMode?.()) {
        richApi.setMarkdown?.(toMarkdownFromHtml(nextHtml, { slackFormat: false }));
      }
      normalizeContent();
      validation.clearManualError();
      if (validation.hasRules) validation.check();
      if (counter) counterController.update();
    }
  });

  Object.defineProperty(root, 'html', {
    get: getHtml,
    set: (v) => {
      const nextHtml = v || '';
      editableEl.innerHTML = nextHtml;
      if (richApi?.isMarkdownMode?.()) {
        richApi.setMarkdown?.(toMarkdownFromHtml(nextHtml, { slackFormat: false }));
      }
      normalizeContent();
      validation.clearManualError();
      if (validation.hasRules) validation.check();
      if (counter) counterController.update();
    }
  });

  root.isValid = validation.check;
  root.error = validation.error;
  root.ok = validation.ok;
  root.toMarkdown = () => toMarkdownFromHtml(getHtml(), { slackFormat: false });
  root.toSlackMarkdown = () => toMarkdownFromHtml(getHtml(), { slackFormat: true });
  root.fromMarkdown = (markdown) => {
    const html = toHtmlFromMarkdown(markdown);
    editableEl.innerHTML = html;
    if (richApi?.isMarkdownMode?.()) {
      richApi.setMarkdown?.(String(markdown || ''));
    }
    normalizeContent();
    validation.clearManualError();
    if (validation.hasRules) validation.check();
    if (counter) counterController.update();
    return html;
  };
  root.toggleMarkdownMode = (force) => richApi?.toggleMarkdownMode?.(force) ?? false;
  root.isMarkdownMode = () => richApi?.isMarkdownMode?.() ?? false;
  root.setLimits = (minOrConfig, maxValue) => {
    const { min: nextMin, max: nextMax } = parseLimitArgs(minOrConfig, maxValue);

    if (nextMin !== undefined) currentMin = nextMin;
    if (nextMax !== undefined) currentMax = nextMax;

    validation.setLimits({ min: nextMin, max: nextMax });
    counterController.setLimits({ min: nextMin, max: nextMax });

    validation.check();
    if (counter) counterController.update();
  };

  root.reset = () => {
    editableEl.innerHTML = '';
    richApi?.setMarkdown?.('');
    normalizeContent();
    validation.reset();
    if (counter) counterController.reset();
  };

  if (rich) {
    richApi = addRichTextUI(root, editableDiv, richInclude, richExclude);
  }

  return root;
}

// ---> rich text editor

function addRichTextUI(root, editableEl, richInclude, richExclude) {
  editableEl.setAttribute('role', 'textbox');
  editableEl.setAttribute('aria-multiline', 'true');

  const available = ['heading', 'bold', 'italic', 'underline', 'strikethrough', 'quote', 'list', 'link', 'markdown', 'clear'];
  let applied = Array.isArray(richInclude) 
    ? available.filter((option) => richInclude.includes(option))
    : available;

  if (Array.isArray(richExclude)) { 
    applied = applied.filter((option) => !richExclude.includes(option));
  }

  // Toolbar
  const toolbar = row({ gap: 1, align: 'center', class: bem.el('toolbar') });
  toolbar.setAttribute('role', 'toolbar');
  root.insertBefore(toolbar, editableEl);

  let markdownMode = false;
  let markdownValue = '';

  // --- Selection save/restore (for dialogs like link prompt) ---
  let savedRange = null;

  const saveSelection = () => {
    if (markdownMode) return null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!editableEl.contains(range.commonAncestorContainer)) return null;
    savedRange = range.cloneRange();
    return savedRange;
  };

  const restoreSelection = () => {
    if (markdownMode) return false;
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

  const getMarkdown = () => {
    if (markdownMode) {
      markdownValue = editableEl.textContent || '';
      return markdownValue;
    }
    return toMarkdownFromHtml(editableEl.innerHTML, { slackFormat: false });
  };

  const setMarkdown = (value = '') => {
    markdownValue = String(value || '');
    if (markdownMode) {
      editableEl.textContent = markdownValue;
    } else {
      editableEl.innerHTML = toHtmlFromMarkdown(markdownValue);
    }
    updateActiveStates();
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

  const formattingStylePattern = /^(font-weight|font-style|text-decoration)\s*:/i;
  const hasOnlyFormattingStyles = (styleText = '') => {
    const rules = String(styleText)
      .split(';')
      .map((rule) => rule.trim())
      .filter(Boolean);
    return rules.length > 0 && rules.every((rule) => formattingStylePattern.test(rule));
  };

  const normalizeRichMarkup = () => {
    // Flatten duplicated inline formatting wrappers generated by repeated toggles.
    editableEl.querySelectorAll('b b, b strong, strong b, strong strong, i i, i em, em i, em em, s s, s strike, strike s, strike strike, del del, s del, del s').forEach(unwrapNode);

    editableEl.querySelectorAll('span[style], b[style], i[style], strong[style], em[style], s[style], strike[style], del[style]').forEach((node) => {
      const style = node.getAttribute('style') || '';
      const hasBoldStyle = /font-weight\s*:\s*(bold|[6-9]00)/i.test(style);
      const hasItalicStyle = /font-style\s*:\s*italic/i.test(style);
      const hasStrikeStyle = /text-decoration\s*:\s*line-through/i.test(style);
      const onlyFormattingStyles = hasOnlyFormattingStyles(style);

      if (node.tagName === 'SPAN' && onlyFormattingStyles && hasBoldStyle && !hasAncestorTag(node, ['b', 'strong'])) {
        const b = document.createElement('b');
        node.replaceWith(b);
        b.appendChild(node);
      }

      if (node.tagName === 'SPAN' && onlyFormattingStyles && hasItalicStyle && !hasAncestorTag(node, ['i', 'em'])) {
        const i = document.createElement('i');
        node.replaceWith(i);
        i.appendChild(node);
      }

      if (node.tagName === 'SPAN' && onlyFormattingStyles && hasStrikeStyle && !hasAncestorTag(node, ['s', 'strike', 'del'])) {
        const s = document.createElement('s');
        node.replaceWith(s);
        s.appendChild(node);
      }

      node.removeAttribute('style');
    });

    // Normalize all heading levels to h3 in rich mode.
    editableEl.querySelectorAll('h1, h2, h4, h5, h6').forEach((headingEl) => {
      replaceTag(headingEl, 'h3');
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

    editableEl.querySelectorAll('b, strong, i, em, s, strike, del').forEach((inlineEl) => {
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

  const isUnderlineActive = () => {
    return queryState('underline');
  };

  const isStrikethroughActive = () => {
    return queryState('strikeThrough');
  };

  const isQuoteActive = () => {
    const node = getSelectionNode();
    return !!node?.closest?.('blockquote');
  };

  const getSelectedLink = () => {
    const node = getSelectionNode();
    return node?.closest?.('a') || null;
  };

  // --- Command execution ---
  // execCommand is deprecated but still the simplest cross-browser method for 'minimal UI'
  const exec = (command, value = null) => {
    if (markdownMode) return;
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
      if (norm) {
        if (/^h[1-6]$/.test(norm)) return 'h3';
        return norm === 'div' ? 'p' : norm;
      }
    } catch {}

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 'p';
    let node = sel.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    if (!editableEl.contains(node)) return 'p';
    const block = node.closest?.('h1,h2,h3,h4,h5,h6,p,div');
    const tag = (block?.tagName || 'p').toLowerCase();
    if (/^h[1-6]$/.test(tag)) return 'h3';
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

  const isCollapsedSelection = () => {
    const sel = window.getSelection();
    return !!(sel && sel.rangeCount && sel.getRangeAt(0).collapsed);
  };

  const toggleQuote = () => {
    const quoteEl = getSelectionNode()?.closest?.('blockquote');
    if (quoteEl && editableEl.contains(quoteEl)) {
      unwrapNode(quoteEl);
      normalizeRichMarkup();
      saveSelection();
      updateActiveStates();
      editableEl.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    exec('formatBlock', 'blockquote');
    if (!isQuoteActive()) {
      exec('formatBlock', '<blockquote>');
    }
  };

  const toggleHeading = () => {
    let blockEl = getCurrentBlockElement();
    if (!blockEl) {
      const nextTag = getCurrentBlock() === 'h3' ? 'div' : 'h3';
      const hasContent = !!editableEl.textContent?.trim();
      if (hasContent) {
        blockEl = document.createElement(nextTag);
        while (editableEl.firstChild) {
          blockEl.appendChild(editableEl.firstChild);
        }
        editableEl.appendChild(blockEl);
      } else {
        blockEl = createBlockAtCaret(nextTag);
      }
    } else {
      const currentTag = blockEl.tagName.toLowerCase();
      const isHeading = /^h[1-6]$/.test(currentTag);
      const nextTag = isHeading ? 'div' : 'h3';
      blockEl = replaceTag(blockEl, nextTag);
    }

    normalizeRichMarkup();
    setCaretInBlock(blockEl, false);
    saveSelection();
    updateActiveStates();
    editableEl.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const toggleMarkdownMode = (force) => {
    const nextMode = typeof force === 'boolean' ? force : !markdownMode;
    if (nextMode === markdownMode) return markdownMode;

    if (nextMode) {
      markdownValue = toMarkdownFromHtml(editableEl.innerHTML, { slackFormat: false });
      markdownMode = true;
      editableEl.classList.add(bem('markdown'));
      editableEl.textContent = markdownValue;
      linkTooltip?.hide?.();
      updateActiveStates();
      editableEl.dispatchEvent(new Event('input', { bubbles: true }));
      requestAnimationFrame(() => focusEditor());
      return markdownMode;
    }

    markdownValue = editableEl.textContent || '';
    markdownMode = false;
    editableEl.classList.remove(bem('markdown'));
    editableEl.innerHTML = toHtmlFromMarkdown(markdownValue);
    normalizeRichMarkup();
    updateActiveStates();
    editableEl.dispatchEvent(new Event('input', { bubbles: true }));
    focusEditor();
    saveSelection();
    return markdownMode;
  };

  const makeButton = ({ option, icon, onClick, isActive, isMarkdownToggle = false }) => {
    //const isMandatory = applied.length && option === 'clear';
    if (!applied.includes(option)) { // !isMandatory &&
      return;
    }
    const btn = button({
      icon,
      variant: 'ghost',
      class: ['rte-btn', bem.el('rte-btn')],
      tip: icon.charAt(0).toUpperCase() + icon.substring(1).replace('-', ' '),
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
    btn._rteMarkdownToggle = isMarkdownToggle;
    return btn;
  };

  // --- Buttons ---
  const buttons = [];

  buttons.push(
    makeButton({
      option: 'heading',
      icon: 'heading',
      onClick: () => toggleHeading(),
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
      option: 'underline',
      icon: 'underline',
      onClick: () => toggleInlineCommand('underline', isUnderlineActive, 'u'),
      isActive: isUnderlineActive,
    }),
    makeButton({
      option: 'strikethrough',
      icon: 'strikethrough',
      onClick: () => toggleInlineCommand('strikeThrough', isStrikethroughActive, 's,strike,del'),
      isActive: isStrikethroughActive,
    }),
    makeButton({
      option: 'quote',
      icon: 'quote',
      onClick: () => toggleQuote(),
      isActive: isQuoteActive,
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

  const markdownBtn = toggle({
    class: bem.el('markdown-toggle'),
    options: [ 'rick text', 'markdown' ],
    variant: 'minimal',
    onchange: () => toggleMarkdownMode(),
    isActive: () => markdownMode,
    isMarkdownToggle: true,
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
  row(toolbar, [markdownBtn, ...buttons, linkBtn, unlinkBtn, clearBtn], { end: true, gap: 0 });

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
      const isMarkdownToggle = !!btn._rteMarkdownToggle;
      const disabled = markdownMode && !isMarkdownToggle;
      btn.disabled = disabled;
      const active = isMarkdownToggle
        ? markdownMode
        : (!disabled && typeof btn._rteIsActive === 'function' ? btn._rteIsActive() : false);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('is-active', !!active);
    });
  };

  // Update states on selection changes, input, focus
  const onSelectionChange = () => {
    if (markdownMode) return;
    if (!isSelectionInEditor()) return;
    updateActiveStates();
  };

  const syncMarkdownFromEditor = () => {
    if (!markdownMode) return;
    markdownValue = editableEl.textContent || '';
  };

  document.addEventListener('selectionchange', onSelectionChange);
  editableEl.addEventListener('input', syncMarkdownFromEditor);
  editableEl.addEventListener('input', normalizeRichMarkup);
  editableEl.addEventListener('input', updateActiveStates);
  editableEl.addEventListener('focus', updateActiveStates);
  editableEl.addEventListener('keyup', updateActiveStates);
  editableEl.addEventListener('mouseup', updateActiveStates);
  const onRichKeydown = (e) => {
    if (markdownMode) return;
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
    if (markdownMode) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
      return;
    }
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
      editableEl.removeEventListener('input', syncMarkdownFromEditor);
      editableEl.removeEventListener('keydown', onRichKeydown);
      linkTooltip?.destroy?.();
      toolbar.remove();
    },
    getHTML() {
      return markdownMode
        ? toHtmlFromMarkdown(markdownValue)
        : editableEl.innerHTML;
    },
    setHTML(html) {
      const nextHtml = html || '';
      if (markdownMode) {
        markdownValue = toMarkdownFromHtml(nextHtml, { slackFormat: false });
        editableEl.textContent = markdownValue;
      } else {
        editableEl.innerHTML = nextHtml;
      }
      updateActiveStates();
    },
    getMarkdown,
    setMarkdown,
    toggleMarkdownMode,
    isMarkdownMode() {
      return markdownMode;
    },
    focus: focusEditor,
  };
}
