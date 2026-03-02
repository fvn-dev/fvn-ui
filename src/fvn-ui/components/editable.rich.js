const TOGGLE_TYPES = new Set([
  'bold',
  'italic',
  'heading',
  'quote',
  'list',
  'link',
]);
const BOLD_TAGS = ['B', 'STRONG'];
const ITALIC_TAGS = ['I', 'EM'];
const INLINE_TOGGLES = Object.freeze({
  bold: {command: 'bold', tags: BOLD_TAGS, contextKey: 'boldEl'},
  italic: {command: 'italic', tags: ITALIC_TAGS, contextKey: 'italicEl'},
});
const EMPTY_STATE = Object.freeze({
  bold: false,
  italic: false,
  heading: false,
  list: false,
  link: false,
  href: null,
  quote: false,
});
function getSelectionRange() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  return selection.getRangeAt(0);
}
function setSelectionRange(range) {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  selection.removeAllRanges();
  selection.addRange(range);
}
function isInEditor(editor, node) {
  return !!node && editor.contains(node);
}
function nodeToElement(node) {
  return node && node.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
}
function closestTag(editor, node, tagName) {
  let current = nodeToElement(node);
  while (current && current !== editor) {
    if (current.nodeName === tagName) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}
function closestTagAny(editor, node, tags) {
  let current = nodeToElement(node);
  while (current && current !== editor) {
    for (const tag of tags) {
      if (current.nodeName === tag) {
        return current;
      }
    }
    current = current.parentElement;
  }
  return null;
}
function clampOffset(container, offset) {
  if (container.nodeType === Node.TEXT_NODE) {
    const textLength = container.textContent ? container.textContent.length : 0;
    return Math.max(0, Math.min(offset, textLength));
  }
  return Math.max(0, Math.min(offset, container.childNodes.length));
}
function sameState(a, b) {
  return (
    a.bold === b.bold
    && a.italic === b.italic
    && a.heading === b.heading
    && a.list === b.list
    && a.link === b.link
    && a.href === b.href
    && a.quote === b.quote
  );
}
function safeExec(command, value) {
  if (typeof document.execCommand !== 'function') {
    return false;
  }
  return document.execCommand(command, false, value);
}
function safeQueryState(command) {
  if (typeof document.queryCommandState !== 'function') {
    return false;
  }
  return document.queryCommandState(command);
}
export function withRichText(editable) {
  if (!(editable instanceof HTMLElement)) {
    throw new Error('withRichText expects an HTMLElement');
  }
  const listeners = new Set();
  let currentState = EMPTY_STATE;
  let lastRange = null;
  let destroyed = false;
  const inlineTypingMode = {bold: false, italic: false};
  editable.setAttribute('contenteditable', 'true');
  if (editable.innerHTML.trim() === '') {
    editable.innerHTML = '<p><br></p>';
  }
  function restoreSelection(range) {
    try {
      setSelectionRange(range);
      return true;
    } catch {
      return false;
    }
  }
  function getRangeInEditor() {
    const range = getSelectionRange();
    if (!range) {
      return null;
    }
    if (!isInEditor(editable, range.startContainer) || !isInEditor(editable, range.endContainer)) {
      return null;
    }
    return range;
  }
  function focusNow() {
    if (!destroyed) {
      editable.focus();
    }
  }
  function stabilizeFocus() {
    focusNow();
    const run = () => focusNow();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(run);
      return;
    }
    setTimeout(run, 0);
  }
  function ensureRangeInEditor() {
    const currentRange = getRangeInEditor();
    if (currentRange) {
      if (document.activeElement !== editable) {
        focusNow();
      }
      return currentRange;
    }
    focusNow();
    if (lastRange && restoreSelection(lastRange.cloneRange())) {
      const restoredRange = getRangeInEditor();
      if (restoredRange) {
        return restoredRange;
      }
    }
    const fallback = document.createRange();
    fallback.selectNodeContents(editable);
    fallback.collapse(false);
    if (!restoreSelection(fallback)) {
      return null;
    }
    return getRangeInEditor();
  }
  function rememberRange() {
    const range = getRangeInEditor();
    if (range) {
      lastRange = range.cloneRange();
    }
  }
  function restoreCollapsedSelection(originalRange, fallbackNode) {
    const startContainer = originalRange.startContainer;
    if (isInEditor(editable, startContainer)) {
      const restored = document.createRange();
      const offset = clampOffset(startContainer, originalRange.startOffset);
      restored.setStart(startContainer, offset);
      restored.collapse(true);
      if (restoreSelection(restored)) {
        return;
      }
    }
    const fallbackTarget = isInEditor(editable, fallbackNode) ? fallbackNode : editable;
    const fallbackRange = document.createRange();
    fallbackRange.selectNodeContents(fallbackTarget);
    fallbackRange.collapse(false);
    restoreSelection(fallbackRange);
  }
  function runWithSectionSelection(range, section, action) {
    const originalRange = range.cloneRange();
    const sectionRange = document.createRange();
    sectionRange.selectNodeContents(section);
    if (restoreSelection(sectionRange)) {
      action();
    }
    restoreCollapsedSelection(originalRange, section.parentElement);
  }
  function readRangeContext(range) {
    const startNode = range.startContainer;
    return {
      startNode,
      headingEl: closestTag(editable, startNode, 'H2'),
      quoteEl: closestTag(editable, startNode, 'BLOCKQUOTE'),
      listItemEl: closestTag(editable, startNode, 'LI'),
      linkEl: closestTag(editable, startNode, 'A'),
      boldEl: closestTagAny(editable, startNode, BOLD_TAGS),
      italicEl: closestTagAny(editable, startNode, ITALIC_TAGS),
    };
  }
  function isInlineTagActive(range, startInlineEl, tags) {
    if (!startInlineEl) {
      return false;
    }
    return range.collapsed || !!closestTagAny(editable, range.endContainer, tags);
  }
  function stateFromContext(range, ctx) {
    const heading = !!ctx.headingEl;
    const bold = isInlineTagActive(range, ctx.boldEl, BOLD_TAGS) || (safeQueryState('bold') && !heading);
    const italic = isInlineTagActive(range, ctx.italicEl, ITALIC_TAGS) || safeQueryState('italic');
    return {
      bold,
      italic,
      heading,
      list: !!ctx.listItemEl,
      link: !!ctx.linkEl,
      href: ctx.linkEl ? ctx.linkEl.getAttribute('href') : null,
      quote: !!ctx.quoteEl,
    };
  }
  function getState() {
    const range = getRangeInEditor();
    if (!range) {
      return {...EMPTY_STATE};
    }
    return stateFromContext(range, readRangeContext(range));
  }
  function emitStateIfChanged(nextState = getState()) {
    if (sameState(currentState, nextState)) {
      return;
    }
    currentState = nextState;
    listeners.forEach((listener) => listener(currentState));
  }
  function clearInlineTypingModes() {
    inlineTypingMode.bold = false;
    inlineTypingMode.italic = false;
  }
  function toggleInline(type, range, ctx, state) {
    const config = INLINE_TOGGLES[type];
    if (!config) {
      return;
    }
    if (!range.collapsed) {
      inlineTypingMode[type] = false;
      safeExec(config.command);
      return;
    }
    if (!state[type]) {
      inlineTypingMode[type] = true;
      safeExec(config.command);
      return;
    }
    if (inlineTypingMode[type]) {
      inlineTypingMode[type] = false;
      safeExec(config.command);
      return;
    }
    const section = ctx[config.contextKey];
    if (section) {
      runWithSectionSelection(range, section, () => safeExec(config.command));
      return;
    }
    safeExec(config.command);
  }
  function toggleBlock(tagName, ctx) {
    const active = tagName === 'H2' ? !!ctx.headingEl : tagName === 'BLOCKQUOTE' ? !!ctx.quoteEl : !!closestTag(editable, ctx.startNode, tagName);
    safeExec('formatBlock', active ? 'P' : tagName);
  }
  function toggleLink(href, range, ctx) {
    const cleanHref = typeof href === 'string' ? href.trim() : href;
    const existingLink = ctx.linkEl;
    if (cleanHref === null || cleanHref === '') {
      if (range.collapsed && existingLink) {
        runWithSectionSelection(range, existingLink, () => safeExec('unlink'));
        return;
      }
      safeExec('unlink');
      return;
    }
    if (typeof cleanHref !== 'string') {
      return;
    }
    if (range.collapsed) {
      if (existingLink) {
        existingLink.setAttribute('href', cleanHref);
      }
      return;
    }
    safeExec('createLink', cleanHref);
  }
  function syncState() {
    rememberRange();
    const nextState = getState();
    if (!nextState.bold) {
      inlineTypingMode.bold = false;
    }
    if (!nextState.italic) {
      inlineTypingMode.italic = false;
    }
    emitStateIfChanged(nextState);
  }
  function withEditorContext(action) {
    const range = ensureRangeInEditor();
    if (!range) {
      return;
    }
    const ctx = readRangeContext(range);
    const state = stateFromContext(range, ctx);
    action(range, ctx, state);
    stabilizeFocus();
    syncState();
  }
  function toggle(type, value) {
    if (destroyed || !TOGGLE_TYPES.has(type)) {
      return;
    }
    withEditorContext((range, ctx, state) => {
      switch (type) {
        case 'bold':
        case 'italic':
          toggleInline(type, range, ctx, state);
          break;
        case 'heading':
          clearInlineTypingModes();
          toggleBlock('H2', ctx);
          break;
        case 'quote':
          clearInlineTypingModes();
          toggleBlock('BLOCKQUOTE', ctx);
          break;
        case 'list':
          clearInlineTypingModes();
          safeExec('insertUnorderedList');
          break;
        case 'link':
          clearInlineTypingModes();
          toggleLink(value, range, ctx);
          break;
        default:
          break;
      }
    });
  }
  function toRect(rect, forceZeroWidth) {
    if (!rect) {
      return null;
    }
    const x = rect.left;
    const y = rect.top;
    const w = forceZeroWidth ? 0 : rect.width;
    const h = rect.height;
    if (![x, y, w, h].every(Number.isFinite)) {
      return null;
    }
    return {x, y, w, h};
  }
  function getProbeRect(buildProbe, useRightEdge) {
    try {
      const probe = document.createRange();
      buildProbe(probe);
      const baseRect = toRect(probe.getBoundingClientRect(), false);
      if (!baseRect || baseRect.h <= 0) {
        return null;
      }
      return {
        x: useRightEdge ? baseRect.x + baseRect.w : baseRect.x,
        y: baseRect.y,
        w: 0,
        h: baseRect.h,
      };
    } catch {
      return null;
    }
  }
  function rangeToViewportRect(range) {
    const directRect = toRect(range.getBoundingClientRect(), false);
    if (!range.collapsed) {
      return directRect;
    }
    if (directRect && directRect.h > 0) {
      return {...directRect, w: 0};
    }
    const container = range.startContainer;
    const offset = range.startOffset;
    const probes = [];
    if (container.nodeType === Node.TEXT_NODE) {
      const textLength = container.textContent ? container.textContent.length : 0;
      if (offset > 0) {
        probes.push({
          rightEdge: true,
          build: (probe) => {
            probe.setStart(container, offset - 1);
            probe.setEnd(container, offset);
          },
        });
      }
      if (offset < textLength) {
        probes.push({
          rightEdge: false,
          build: (probe) => {
            probe.setStart(container, offset);
            probe.setEnd(container, offset + 1);
          },
        });
      }
    }
    if (container.nodeType === Node.ELEMENT_NODE) {
      const beforeNode = container.childNodes[offset - 1];
      const afterNode = container.childNodes[offset];
      if (beforeNode) {
        probes.push({
          rightEdge: true,
          build: (probe) => {
            probe.selectNode(beforeNode);
          },
        });
      }
      if (afterNode) {
        probes.push({
          rightEdge: false,
          build: (probe) => {
            probe.selectNode(afterNode);
          },
        });
      }
    }
    for (const probe of probes) {
      const rect = getProbeRect(probe.build, probe.rightEdge);
      if (rect) {
        return rect;
      }
    }
    const anchor = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
    if (anchor && isInEditor(editable, anchor)) {
      const anchorRect = toRect(anchor.getBoundingClientRect(), true);
      if (anchorRect) {
        return anchorRect;
      }
    }
    return toRect(editable.getBoundingClientRect(), true);
  }
  function resume() {
    if (!destroyed) {
      withEditorContext(() => {});
    }
  }
  function position() {
    if (destroyed) {
      return null;
    }
    const range = getRangeInEditor();
    if (!range) {
      return null;
    }
    return rangeToViewportRect(range);
  }
  function onKeyDown(event) {
    if (
      event.defaultPrevented
      || event.key !== 'Enter'
      || event.shiftKey
      || event.ctrlKey
      || event.metaKey
      || event.altKey
    ) {
      return;
    }
    const range = getRangeInEditor();
    if (!range) {
      return;
    }
    const ctx = readRangeContext(range);
    if (ctx.listItemEl) {
      return;
    }
    setTimeout(() => {
      if (destroyed) {
        return;
      }
      const freshRange = getRangeInEditor();
      if (!freshRange) {
        return;
      }
      const freshCtx = readRangeContext(freshRange);
      if (freshCtx.listItemEl) {
        return;
      }
      const state = stateFromContext(freshRange, freshCtx);
      safeExec('formatBlock', 'P');
      if (state.bold) {
        safeExec('bold');
      }
      if (state.italic) {
        safeExec('italic');
      }
      if (state.link || freshCtx.linkEl) {
        safeExec('unlink');
      }
      clearInlineTypingModes();
      syncState();
    }, 0);
  }
  currentState = getState();
  const bindings = [
    [document, 'selectionchange', syncState],
    [editable, 'input', syncState],
    [editable, 'keyup', syncState],
    [editable, 'blur', rememberRange],
    [editable, 'keydown', onKeyDown],
  ];
  function setBindings(on) {
    const method = on ? 'addEventListener' : 'removeEventListener';
    for (const [target, eventName, handler] of bindings) {
      target[method](eventName, handler);
    }
  }
  setBindings(true);
  return {
    toggle,
    resume,
    position,
    listen(callback) {
      if (typeof callback !== 'function') {
        throw new Error('listen(callback) expects a function');
      }
      listeners.add(callback);
      callback(currentState);
      return () => {
        listeners.delete(callback);
      };
    },
    getState() {
      return getState();
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      listeners.clear();
      setBindings(false);
    },
  };
}
export default withRichText;
