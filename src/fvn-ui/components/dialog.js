import { el, col, getCallback, parseArgs, onOutsideClick, configToClasses, bemFactory } from '../dom.js'
import './dialog.css'

const bem = bemFactory('dialog');
const bemPop = bemFactory('popover');
const dialogCache = new WeakMap();

const HOVER_EVENT_TYPES = new Set(['mouseenter', 'mouseover', 'pointerenter']);
const TRANSIENT_EVENT_TYPES = new Set(['mouseenter', 'mouseover', 'pointerenter', 'focus', 'focusin']);
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');
const OPPOSITE_POSITION = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

let bodyScrollLockCount = 0;
let bodyOverflow = '';
let bodyPaddingRight = '';
const modalStack = [];

const isElement = (value) => value instanceof Element;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizePosition = (value) => {
  if (!value) return 'bottom';
  return ['top', 'bottom', 'left', 'right'].includes(value) ? value : 'bottom';
};

const normalizeScrollPolicy = (value, fallback = 'reposition') => {
  return value === 'close' || value === 'reposition' ? value : fallback;
};

const isTopModal = (root) => modalStack.length && modalStack.at(-1) === root;

const pushModal = (root) => {
  const idx = modalStack.indexOf(root);
  if (idx !== -1) {
    modalStack.splice(idx, 1);
  }
  modalStack.push(root);
};

const pullModal = (root) => {
  const idx = modalStack.indexOf(root);
  if (idx !== -1) {
    modalStack.splice(idx, 1);
  }
};

const lockBodyScroll = () => {
  if (bodyScrollLockCount > 0) {
    bodyScrollLockCount++;
    return;
  }

  const body = document.body;
  bodyOverflow = body.style.overflow;
  bodyPaddingRight = body.style.paddingRight;

  const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  if (scrollbarWidth > 0) {
    const currentPadding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
  }

  body.style.overflow = 'hidden';
  bodyScrollLockCount = 1;
};

const unlockBodyScroll = () => {
  if (bodyScrollLockCount <= 0) {
    return;
  }

  bodyScrollLockCount--;
  if (bodyScrollLockCount > 0) {
    return;
  }

  const body = document.body;
  body.style.overflow = bodyOverflow;
  body.style.paddingRight = bodyPaddingRight;
};

const getAnchorFromTrigger = (trigger, fallbackAnchor) => {
  if (trigger instanceof Event) {
    return trigger.currentTarget || trigger.target || fallbackAnchor || null;
  }
  if (isElement(trigger)) {
    return trigger;
  }
  if (trigger === true && isElement(fallbackAnchor)) {
    return fallbackAnchor;
  }
  return isElement(fallbackAnchor) ? fallbackAnchor : null;
};

const eventType = (trigger) => trigger instanceof Event ? String(trigger.type || '').toLowerCase() : '';
const isHoverTriggerEvent = (trigger) => HOVER_EVENT_TYPES.has(eventType(trigger));
const isTransientTriggerEvent = (trigger) => TRANSIENT_EVENT_TYPES.has(eventType(trigger));

const getDefaultScrollPolicy = ({ provided, hover, trigger }) => {
  if (provided === 'close' || provided === 'reposition') {
    return provided;
  }
  if (hover) {
    return 'close';
  }
  if (isTransientTriggerEvent(trigger)) {
    return 'close';
  }
  return 'reposition';
};

const ensureContent = (contentEl, content, close) => {
  contentEl.innerHTML = '';
  let value = content;

  if (typeof value === 'function') {
    value = value(close);
  }

  if (value == null) {
    return;
  }

  if (typeof value === 'string') {
    contentEl.innerHTML = value;
    return;
  }

  if (value instanceof Node) {
    contentEl.appendChild(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((child) => {
      if (child == null) return;
      if (child instanceof Node) {
        contentEl.appendChild(child);
      } else {
        contentEl.append(String(child));
      }
    });
    return;
  }

  contentEl.append(String(value));
};

const getFocusable = (container) => {
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)]
    .filter((node) => !node.hasAttribute('disabled'))
    .filter((node) => node.getAttribute('aria-hidden') !== 'true')
    .filter((node) => {
      if (node === document.activeElement) return true;
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
};

const ensurePositioningContext = (target) => {
  if (!target || target === document.body || target === document.documentElement) {
    return;
  }
  const style = getComputedStyle(target);
  if (style.position === 'static') {
    target.style.position = 'relative';
  }
};

const getPositionOrder = (requested, spaces) => {
  const pos = normalizePosition(requested);
  const opposite = OPPOSITE_POSITION[pos];
  const verticalFallback = spaces.left > spaces.right ? ['left', 'right'] : ['right', 'left'];
  const horizontalFallback = spaces.top > spaces.bottom ? ['top', 'bottom'] : ['bottom', 'top'];
  const extras = pos === 'top' || pos === 'bottom' ? verticalFallback : horizontalFallback;

  return [pos, opposite, ...extras].filter((side, idx, arr) => arr.indexOf(side) === idx);
};

const canFit = (side, width, height, spaces, gap) => {
  if (side === 'top' || side === 'bottom') {
    return height <= Math.max(0, spaces[side] - gap);
  }
  return width <= Math.max(0, spaces[side] - gap);
};

const pickPosition = (requested, spaces, width, height, gap) => {
  const order = getPositionOrder(requested, spaces);
  const fitting = order.find((side) => canFit(side, width, height, spaces, gap));
  if (fitting) {
    return fitting;
  }
  return order.reduce((best, side) => (spaces[side] > spaces[best] ? side : best), order[0]);
};

const getViewportCoords = (position, anchorRect, width, height, gap) => {
  const anchorCenterX = anchorRect.left + anchorRect.width / 2;
  const anchorCenterY = anchorRect.top + anchorRect.height / 2;

  if (position === 'top') {
    return { left: anchorCenterX - width / 2, top: anchorRect.top - height - gap };
  }
  if (position === 'bottom') {
    return { left: anchorCenterX - width / 2, top: anchorRect.bottom + gap };
  }
  if (position === 'left') {
    return { left: anchorRect.left - width - gap, top: anchorCenterY - height / 2 };
  }
  return { left: anchorRect.right + gap, top: anchorCenterY - height / 2 };
};

const viewportToContainerCoords = (container, viewportLeft, viewportTop) => {
  if (!container || container === document.body || container === document.documentElement) {
    return {
      left: viewportLeft + window.scrollX,
      top: viewportTop + window.scrollY
    };
  }

  const rect = container.getBoundingClientRect();
  return {
    left: viewportLeft - rect.left + container.scrollLeft,
    top: viewportTop - rect.top + container.scrollTop
  };
};

const findModalLayer = (node) => {
  if (!isElement(node)) {
    return null;
  }
  return node.closest('[data-ui-modal-layer="true"]');
};

/**
 * Creates a dialog (modal or popover/tooltip)
 * @param {Object} config
 * @param {string|HTMLElement|HTMLElement[]} [config.content] - Dialog content
 * @param {'modal'|'tooltip'} [config.variant='modal'] - Dialog type (alias: type)
 * @param {'modal'|'tooltip'} [config.type] - Dialog type (alias: variant)
 * @param {Event|HTMLElement|boolean} [config.open] - Event/element to trigger open (alias: toggled)
 * @param {Event|HTMLElement|boolean} [config.toggled] - Event/element to trigger open (alias: open)
 * @param {HTMLElement} [config.anchor] - Anchor element for positioning
 * @param {'top'|'bottom'|'left'|'right'} [config.position='bottom'] - Popover position
 * @param {boolean} [config.arrow=true] - Show arrow on popover
 * @param {'close'|'reposition'} [config.scrollPolicy] - Scroll behavior for open popovers
 * @param {boolean} [config.inverted] - Dark/inverted style
 * @param {boolean} [config.closeOnBackdrop=true] - Close modal when backdrop is clicked
 * @param {boolean} [config.closeOnEscape=true] - Close dialog when Escape is pressed
 * @param {Function} [config.onOpen] - Called when dialog opens
 * @param {Function} [config.onClose] - Called when dialog closes
 * @returns {HTMLElement} Dialog element with show(), hide(), toggle(), isOpen
 * @example
 * // Modal triggered by click
 * modal({ open: clickEvent, content: card({ title: 'Confirm' }) })
 * // Hover tooltip
 * tooltip({ open: mouseEvent, content: 'Tooltip text', inverted: true })
 * @see modal - Alias with type='modal'
 * @see tooltip - Alias with type='tooltip'
 */
export function dialog(...args) {
  const {
    parent,
    variant = 'modal',
    type,
    anchor,
    position = 'bottom',
    arrow = true,
    content,
    toggled,
    open: shouldOpen,
    hover,
    scrollPolicy,
    inverted,
    small,
    closeOnBackdrop = true,
    closeOnEscape = true,
    props,
    ...rest
  } = parseArgs(...args);

  const resolvedVariant = type || variant || 'modal';
  const isModal = resolvedVariant === 'modal';
  const toggleTrigger = toggled || shouldOpen;

  if (toggleTrigger) {
    const anchorEl = getAnchorFromTrigger(toggleTrigger, anchor);
    const isHover = isHoverTriggerEvent(toggleTrigger);
    const resolvedScrollPolicy = getDefaultScrollPolicy({
      provided: scrollPolicy,
      hover: hover ?? isHover,
      trigger: toggleTrigger
    });

    if (anchorEl) {
      const cached = dialogCache.get(anchorEl);
      if (cached?.isConnected) {
        if (content !== undefined) {
          cached.setContent?.(content);
        }
        if (isHover) {
          if (!cached.isOpen) cached.show(anchorEl);
        } else {
          cached.toggle(anchorEl);
        }
        return cached;
      }
    }

    const instance = dialog({
      ...rest,
      parent,
      variant: resolvedVariant,
      anchor: anchorEl,
      position,
      arrow,
      content,
      hover: hover ?? isHover,
      scrollPolicy: resolvedScrollPolicy,
      inverted,
      small,
      closeOnBackdrop,
      closeOnEscape
    });

    if (anchorEl) {
      dialogCache.set(anchorEl, instance);
    }

    instance.show(anchorEl || toggleTrigger);
    return instance;
  }

  const cbOpen = getCallback('onOpen', rest);
  const cbClose = getCallback('onClose', rest);
  const explicitScrollPolicy = scrollPolicy === 'close' || scrollPolicy === 'reposition';

  let isOpen = false;
  let currentAnchor = isElement(anchor) ? anchor : null;
  let activeScrollPolicy = normalizeScrollPolicy(scrollPolicy, hover ? 'close' : 'reposition');
  let cleanupOutside;
  let detachHover;
  let removeResize;
  let removeScroll;
  let positionRaf = 0;
  let returnFocusEl;
  let arrowEl;

  const contentEl = col({ class: bem.el('content') });

  const rootClasses = [
    isModal ? bem() : bemPop(),
    small && (isModal ? bem('small') : bemPop('small')),
    'ui-dialog-component',
    configToClasses(props),
    rest.class
  ];


  let root;
  let mountNode;
  let modalLayer;
  let modalBackdrop;

  // Helper: check if an element or its ancestors have .fvn-ui
  function hasFvnUiAncestor(node) {
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.classList && node.classList.contains('fvn-ui')) return true;
      node = node.parentElement;
    }
    return false;
  }

  // Helper: wrap node in <div class="fvn-ui"> if needed
  function wrapWithFvnUiIfNeeded(node) {
    const bodyHasFvnUi = document.body.classList.contains('fvn-ui');
    if (bodyHasFvnUi || hasFvnUiAncestor(document.body)) return node;
    const wrapper = document.createElement('div');
    wrapper.className = 'fvn-ui';
    wrapper.appendChild(node);
    return wrapper;
  }

  if (isModal) {
    root = el('div', {
      ...rest,
      class: rootClasses,
      attrs: {
        ...(rest.attrs || {}),
        role: 'dialog',
        'aria-modal': 'true',
        tabindex: -1
      },
      children: [contentEl]
    });

    modalBackdrop = el('div', {
      class: bem.el('backdrop'),
      onClick: () => {
        if (closeOnBackdrop) {
          close();
        }
      }
    });

    modalLayer = el('div', {
      class: bem.el('layer'),
      data: { open: 'false', uiModalLayer: 'true' },
      attrs: { 'aria-hidden': 'true' },
      children: [modalBackdrop, root]
    });

    mountNode = wrapWithFvnUiIfNeeded(modalLayer);
  } else {
    root = el('div', {
      ...rest,
      class: rootClasses,
      data: { open: 'false', position: normalizePosition(position) },
      children: [
        arrow && el('div', { class: bemPop.el('arrow'), ref: (node) => (arrowEl = node) }),
        contentEl
      ]
    });
    mountNode = wrapWithFvnUiIfNeeded(root);
  }

  if (inverted) {
    root.classList.add('ui-inverted');
  }

  const clearRaf = () => {
    if (!positionRaf) return;
    cancelAnimationFrame(positionRaf);
    positionRaf = 0;
  };

  const removeGlobalHandlers = () => {
    cleanupOutside?.();
    cleanupOutside = undefined;
    detachHover?.();
    detachHover = undefined;
    removeResize?.();
    removeResize = undefined;
    removeScroll?.();
    removeScroll = undefined;
    clearRaf();
  };

  const setupHoverClose = () => {
    if (!hover || !currentAnchor || isModal) {
      return;
    }

    let closeTimer;
    const queueClose = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        const overAnchor = currentAnchor?.matches(':hover');
        const overRoot = root.matches(':hover');
        if (!overAnchor && !overRoot) {
          close();
        }
      }, 80);
    };

    const cancelClose = () => {
      clearTimeout(closeTimer);
    };

    currentAnchor.addEventListener('mouseleave', queueClose);
    currentAnchor.addEventListener('mouseenter', cancelClose);
    root.addEventListener('mouseleave', queueClose);
    root.addEventListener('mouseenter', cancelClose);

    detachHover = () => {
      clearTimeout(closeTimer);
      currentAnchor?.removeEventListener('mouseleave', queueClose);
      currentAnchor?.removeEventListener('mouseenter', cancelClose);
      root.removeEventListener('mouseleave', queueClose);
      root.removeEventListener('mouseenter', cancelClose);
    };
  };

  const getMountTarget = () => {
    if (isModal) {
      return document.body;
    }

    if (isElement(parent)) {
      return parent;
    }

    const modalParent = findModalLayer(currentAnchor);
    if (modalParent) {
      return modalParent;
    }

    return document.body;
  };

  const positionPopover = () => {
    if (isModal || !currentAnchor || !mountNode.isConnected) {
      return;
    }

    const gap = 8;
    const pad = 12;
    const anchorRect = currentAnchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    root.style.maxHeight = '';
    root.style.overflowY = 'visible';
    contentEl.style.maxHeight = '';
    contentEl.style.overflowY = 'visible';

    let popoverWidth = root.offsetWidth || 200;
    let popoverHeight = root.offsetHeight || 100;

    const spaces = {
      top: Math.max(0, anchorRect.top - pad),
      bottom: Math.max(0, viewportHeight - anchorRect.bottom - pad),
      left: Math.max(0, anchorRect.left - pad),
      right: Math.max(0, viewportWidth - anchorRect.right - pad)
    };

    const resolvedPosition = pickPosition(position, spaces, popoverWidth, popoverHeight, gap);
    root.dataset.position = resolvedPosition;

    const verticalSpace = Math.max(120, viewportHeight - pad * 2);
    if (resolvedPosition === 'top' || resolvedPosition === 'bottom') {
      const directionalSpace = Math.max(120, spaces[resolvedPosition] - gap);
      const contentMaxHeight = Math.max(80, directionalSpace - 24);
      contentEl.style.maxHeight = `${contentMaxHeight}px`;
      contentEl.style.overflowY = 'auto';
    } else {
      const contentMaxHeight = Math.max(80, verticalSpace - 24);
      contentEl.style.maxHeight = `${contentMaxHeight}px`;
      contentEl.style.overflowY = 'auto';
    }

    popoverWidth = root.offsetWidth || popoverWidth;
    popoverHeight = root.offsetHeight || popoverHeight;

    const ideal = getViewportCoords(resolvedPosition, anchorRect, popoverWidth, popoverHeight, gap);
    const clampedLeft = clamp(ideal.left, pad, Math.max(pad, viewportWidth - popoverWidth - pad));
    const clampedTop = clamp(ideal.top, pad, Math.max(pad, viewportHeight - popoverHeight - pad));

    const container = mountNode.parentElement || document.body;
    const coords = viewportToContainerCoords(container, clampedLeft, clampedTop);

    root.style.left = `${coords.left}px`;
    root.style.top = `${coords.top}px`;
    root.style.bottom = 'auto';
    root.style.right = 'auto';

    if (!arrowEl) {
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const arrowPad = 12;

    arrowEl.style.left = '';
    arrowEl.style.top = '';

    if (resolvedPosition === 'top' || resolvedPosition === 'bottom') {
      const arrowLeft = clamp(
        anchorRect.left + anchorRect.width / 2 - rootRect.left,
        arrowPad,
        Math.max(arrowPad, rootRect.width - arrowPad)
      );
      arrowEl.style.left = `${arrowLeft}px`;
    } else {
      const arrowTop = clamp(
        anchorRect.top + anchorRect.height / 2 - rootRect.top,
        arrowPad,
        Math.max(arrowPad, rootRect.height - arrowPad)
      );
      arrowEl.style.top = `${arrowTop}px`;
    }
  };

  const schedulePosition = () => {
    clearRaf();
    positionRaf = requestAnimationFrame(() => {
      positionRaf = 0;
      positionPopover();
    });
  };

  const setupPopoverHandlers = () => {
    if (isModal) {
      return;
    }

    removeResize = () => window.removeEventListener('resize', schedulePosition, true);
    window.addEventListener('resize', schedulePosition, true);

    const onScroll = () => {
      if (activeScrollPolicy === 'close') {
        close();
        return;
      }
      schedulePosition();
    };

    removeScroll = () => {
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('scroll', onScroll, true);
    };
    window.addEventListener('scroll', onScroll, true);
    document.addEventListener('scroll', onScroll, true);

    cleanupOutside = onOutsideClick(root, (event) => {
      if (currentAnchor?.contains(event.target)) {
        return;
      }
      close();
    });

    setupHoverClose();
  };

  const trapFocus = (event) => {
    if (!isModal || !isTopModal(root) || event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusable(root);
    if (!focusable.length) {
      event.preventDefault();
      root.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !root.contains(active))) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && (active === last || !root.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  const onKeydown = (event) => {
    if (!isOpen) {
      return;
    }

    if (isModal && !isTopModal(root)) {
      return;
    }

    if (event.key === 'Escape') {
      if (!closeOnEscape) {
        return;
      }
      event.preventDefault();
      close();
      return;
    }

    trapFocus(event);
  };

  const setContent = (newContent) => {
    ensureContent(contentEl, newContent, close);
    if (isOpen && !isModal) {
      schedulePosition();
    }
  };

  const open = (eventOrElement) => {
    if (isOpen) {
      return;
    }

    if (isElement(eventOrElement)) {
      currentAnchor = eventOrElement;
    } else if (eventOrElement instanceof Event) {
      currentAnchor = eventOrElement.currentTarget || eventOrElement.target || currentAnchor;
      if (!explicitScrollPolicy && !isModal) {
        activeScrollPolicy = normalizeScrollPolicy(undefined, isTransientTriggerEvent(eventOrElement) ? 'close' : 'reposition');
      }
    } else if (!explicitScrollPolicy && !isModal) {
      activeScrollPolicy = normalizeScrollPolicy(undefined, hover ? 'close' : 'reposition');
    }

    const target = getMountTarget();
    if (target && mountNode.parentElement !== target) {
      if (!isModal) {
        ensurePositioningContext(target);
      }
      target.appendChild(mountNode);
    }

    isOpen = true;

    if (isModal) {
      modalLayer.dataset.open = 'true';
      modalLayer.setAttribute('aria-hidden', 'false');
      pushModal(root);
      lockBodyScroll();
      returnFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      requestAnimationFrame(() => {
        const autofocusTarget = root.querySelector('[autofocus]');
        const focusTarget = autofocusTarget || getFocusable(root)[0] || root;
        focusTarget?.focus?.();
      });
    } else {
      root.style.visibility = 'hidden';
      root.dataset.open = 'true';
      positionPopover();
      root.style.visibility = '';
      setupPopoverHandlers();
    }

    document.addEventListener('keydown', onKeydown, true);
    cbOpen?.();
  };

  const close = () => {
    if (!isOpen) {
      return;
    }

    isOpen = false;

    document.removeEventListener('keydown', onKeydown, true);
    removeGlobalHandlers();

    if (isModal) {
      modalLayer.dataset.open = 'false';
      modalLayer.setAttribute('aria-hidden', 'true');
      pullModal(root);
      unlockBodyScroll();
      returnFocusEl?.focus?.();
      returnFocusEl = null;
    } else {
      root.dataset.open = 'false';
    }

    cbClose?.();
  };

  const toggle = (eventOrElement) => (isOpen ? close() : open(eventOrElement));

  ensureContent(contentEl, content, close);

  root.show = open;
  root.hide = close;
  root.toggle = toggle;
  root.setContent = setContent;
  root.destroy = () => {
    close();
    if (currentAnchor) {
      dialogCache.delete(currentAnchor);
    }
    mountNode.remove();
    if (isModal) {
      pullModal(root);
    }
  };
  Object.defineProperty(root, 'isOpen', { get: () => isOpen });

  return root;
}
