import { el, getCallback, parseArgs, onOutsideClick, configToClasses, bemFactory } from '../dom.js'
import './dialog.css'

const bem = bemFactory('dialog');
const bemPop = bemFactory('popover');
const dialogCache = new WeakMap(); // cache toggled dialogs

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
 * @param {boolean} [config.inverted] - Dark/inverted style
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
    toggled, // event or element - creates/toggles dialog on the fly
    open: shouldOpen, // alias for toggled
    hover, // if true, close on mouseleave from anchor/dialog
    inverted,
    _isChildOfAnchor, // internal: tooltip is child of anchor for hover persistence
    props,
    ...rest
  } = parseArgs(...args);

  const toggleEvent = toggled || shouldOpen;
  if (toggleEvent) {
    // Determine anchor: from event, from element, from anchor prop, or null (modal fallback)
    let anchorEl = null;
    let isHoverTrigger = false;
    
    if (toggleEvent instanceof Event) {
      anchorEl = toggleEvent.currentTarget || toggleEvent.target;
      isHoverTrigger = ['mouseover', 'mouseenter'].includes(toggleEvent.type);
      
      // For hover triggers, check cache FIRST before content is evaluated
      // If event target is inside an already-open tooltip, ignore (prevents re-render spam)
      if (isHoverTrigger && anchorEl) {
        const cached = dialogCache.get(anchorEl);
        if (cached?.isOpen) return cached;
      }
    } else if (toggleEvent instanceof Element) {
      anchorEl = toggleEvent;
    } else if (toggleEvent === true && anchor instanceof Element) {
      anchorEl = anchor;
    }
    
    // For hover tooltips: use cache to prevent re-render spam
    // For click/modals: always create fresh (content may have changed)
    if (anchorEl && isHoverTrigger) {
      const cached = dialogCache.get(anchorEl);
      if (cached) {
        if (!cached.isOpen) cached.show();
        return cached;
      }
      
      // Hover tooltips: append to anchor so tooltip persists when hovering it
      anchorEl.style.position = anchorEl.style.position || 'relative';
      
      const newDialog = dialog({ 
        ...rest, 
        parent: anchorEl, 
        variant, type, position, arrow, content, inverted,
        anchor: anchorEl,
        _isChildOfAnchor: true
      });
      dialogCache.set(anchorEl, newDialog);
      newDialog.show();
      
      return newDialog;
    }
    
    // Click-triggered or no anchor: create fresh modal/tooltip, append to body
    const newDialog = dialog({ 
      ...rest, 
      parent: document.body, 
      variant: variant || 'modal', 
      type: type || variant || 'modal',
      position, arrow, content, inverted,
      anchor: anchorEl
    });
    newDialog.show();
    return newDialog;
  }

  const cbOpen = getCallback('onOpen', rest);
  const cbClose = getCallback('onClose', rest);

  let isOpen = false;
  let cleanupOutside;
  let arrowEl;
  let currentAnchor = anchor;

  const effectiveTye = type || variant;
  const isModal = effectiveTye === 'modal';

  const onKeydown = (e) => {
    if (e.key !== 'Escape') {
      return;
    }
    e.preventDefault();
    close();
  };

  const close = () => {
    if (!isOpen) {
      return;
    }
    isOpen = false;    
    isModal ? root.close() : (root.dataset.open = 'false');
    cleanupOutside?.();
    document.removeEventListener('keydown', onKeydown, true);
    cbClose?.();
  };

  const open = (eventOrElement) => {
    if (isOpen) {
      return;
    }

    // Auto-assign anchor from click event or passed element
    if (!anchor && eventOrElement) {
      currentAnchor = eventOrElement instanceof Event 
        ? eventOrElement.currentTarget || eventOrElement.target 
        : eventOrElement;
    }

    // Ensure dialog is in the document before showing
    if (!root.isConnected) {
      document.body.appendChild(root);
    }

    isOpen = true;

    if (isModal) {
      root.showModal();
    } else {
      positionPopover();
      root.dataset.open = 'true';
      // Exclude anchor from outside click detection so toggle works
      cleanupOutside = onOutsideClick(root, (e) => {
        if (currentAnchor?.contains(e.target)) return; // Let toggle handle anchor clicks
        close();
      });
    }

    document.addEventListener('keydown', onKeydown, true);
    cbOpen?.();
  };

  const toggle = (eventOrElement) => isOpen ? close() : open(eventOrElement);

  const positionPopover = () => {
    if (!currentAnchor || isModal) return;
    
    const gap = 8;
    const pad = 12;
    const anchor = currentAnchor.getBoundingClientRect();
    const pw = root.offsetWidth || 200;
    const ph = root.offsetHeight || 100;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Flip vertically if needed
    const pos = (position === 'bottom' && anchor.bottom + ph + gap > vh) ? 'top'
              : (position === 'top' && anchor.top - ph - gap < 0) ? 'bottom'
              : position;
    root.dataset.position = pos;
    
    // Calculate left position (clamped to viewport)
    const anchorCenterX = anchor.left + anchor.width / 2;
    const idealLeft = anchorCenterX - pw / 2;
    const left = Math.max(pad, Math.min(vw - pw - pad, idealLeft));
    
    // Apply positioning
    if (_isChildOfAnchor) {
      // Relative to anchor
      const relativeLeft = left - anchor.left;
      root.style.left = `${relativeLeft}px`;
      root.style.top = pos === 'bottom' ? `${anchor.height + gap}px` : 'auto';
      root.style.bottom = pos === 'top' ? `${anchor.height + gap}px` : 'auto';
    } else {
      // Fixed positioning
      root.style.left = `${left}px`;
      root.style.top = pos === 'bottom' ? `${anchor.bottom + gap}px` : `${anchor.top - ph - gap}px`;
      root.style.bottom = 'auto';
    }
    root.style.transform = 'none';
    
    // Arrow points to anchor center
    if (arrowEl) {
      arrowEl.style.left = `${anchorCenterX - left}px`;
    }
  };

  const contentEl = el('div', {
    class: bem.el('content'),
    children: content 
      ? typeof content === 'function' 
        ? content(close) 
        : !Array.isArray(content) ? [ content ] : content
      : []
  });

  const setContent = (newContent) => {
    contentEl.innerHTML = '';
    if (typeof newContent === 'string') {
      contentEl.innerHTML = newContent;
    } else if (newContent instanceof HTMLElement) {
      contentEl.appendChild(newContent);
    } else if (Array.isArray(newContent)) {
      newContent.forEach(c => contentEl.appendChild(c));
    } else if (typeof newContent === 'function') {
      const result = newContent(close);
      if (result instanceof HTMLElement) contentEl.appendChild(result);
      else if (Array.isArray(result)) result.forEach(c => contentEl.appendChild(c));
    }
  };

  let root;

  if (isModal) {
    root = el('dialog', parent, {
      ...rest,
      class: [bem(), 'ui-dialog-component', configToClasses(props), rest.class],
      onClick: (e) => {
        if (e.target === root) {
          close();
        }
      },
      children: [contentEl]
    });
  } else {
    root = el('div', parent, {
      ...rest,
      class: [bemPop(), 'ui-dialog-component', configToClasses(props), rest.class],
      data: { open: 'false', position },
      style: _isChildOfAnchor ? { position: 'absolute' } : undefined,
      children: [
        arrow && el('div', { class: bemPop.el('arrow'), ref: (e) => arrowEl = e }),
        contentEl
      ]
    });
  }

  inverted && root.classList.add('ui-inverted');

  // Use show/hide/toggle to avoid conflict with native <dialog>.open property
  root.show = open;
  root.hide = close;
  root.toggle = toggle;
  root.setContent = setContent;
  root.destroy = () => {
    close();
    if (currentAnchor) dialogCache.delete(currentAnchor);
    root.remove();
  };
  Object.defineProperty(root, 'isOpen', { get: () => isOpen });

  // Set up hover behavior
  // If child of anchor, only need mouseleave on anchor (tooltip is inside, so hovering it won't trigger leave)
  // Otherwise, need mouseleave on both anchor and tooltip
  if (_isChildOfAnchor && anchor) {
    anchor.addEventListener('mouseleave', close);
  } else if (hover && anchor) {
    anchor.addEventListener('mouseleave', close);
    root.addEventListener('mouseleave', close);
  }

  return root;
}
