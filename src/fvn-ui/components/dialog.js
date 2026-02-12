import { el, getCallback, parseArgs, onOutsideClick, propsToClasses } from '../dom.js'
import './dialog.css'

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
 * @returns {HTMLElement} Dialog element with showDialog(), closeDialog(), toggleDialog(), isOpen
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
    props = {},
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
    
    // If we have an anchor, use cache system
    if (anchorEl) {
      const cached = dialogCache.get(anchorEl);
      if (cached) {
        if (!isHoverTrigger) cached.toggleDialog();
        else if (!cached.isOpen) cached.showDialog();
        return cached;
      }
      
      // For hover triggers, append to anchor so tooltip persists when hovering tooltip
      const dialogParent = isHoverTrigger ? anchorEl : parent;
      if (isHoverTrigger) {
        anchorEl.style.position = anchorEl.style.position || 'relative';
      }
      
      const newDialog = dialog({ 
        ...rest, 
        parent: dialogParent, 
        variant, type, position, arrow, content, inverted,
        anchor: anchorEl,
        _isChildOfAnchor: isHoverTrigger
      });
      dialogCache.set(anchorEl, newDialog);
      newDialog.showDialog();
      
      return newDialog;
    }
    
    // No anchor - create modal, append to body, and open
    const modalDialog = dialog({ 
      ...rest, 
      parent: document.body, 
      variant: 'modal', 
      type: 'modal',
      position, arrow, content, inverted 
    });
    modalDialog.showDialog();
    return modalDialog;
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
      cleanupOutside = onOutsideClick(root, close);
    }

    document.addEventListener('keydown', onKeydown, true);
    cbOpen?.();
  };

  const toggle = (eventOrElement) => isOpen ? close() : open(eventOrElement);

  const positionPopover = () => {
    if (!currentAnchor || isModal) {
      return;
    }
    
    const gap = 8;
    
    // If tooltip is child of anchor, use relative positioning
    if (_isChildOfAnchor) {
      const anchorHeight = currentAnchor.offsetHeight;
      const popoverHeight = root.offsetHeight || 100;
      
      let actualPosition = position;
      // Simple flip check based on viewport position
      const anchorRect = currentAnchor.getBoundingClientRect();
      if (position === 'bottom' && anchorRect.bottom + popoverHeight + gap > window.innerHeight) {
        actualPosition = 'top';
      }
      
      root.style.left = '50%';
      root.style.transform = 'translateX(-50%)';
      root.dataset.position = actualPosition;
      
      if (actualPosition === 'bottom') {
        root.style.top = `${anchorHeight + gap}px`;
        root.style.bottom = 'auto';
      } else {
        root.style.bottom = `${anchorHeight + gap}px`;
        root.style.top = 'auto';
      }
      
      if (arrowEl) {
        arrowEl.style.left = '50%';
        if (actualPosition === 'bottom') {
          arrowEl.style.top = 'var(--arrow-space)';
          arrowEl.style.bottom = 'auto';
        } else {
          arrowEl.style.bottom = 'var(--arrow-space)';
          arrowEl.style.top = 'auto';
        }
        arrowEl.style.transform = actualPosition === 'bottom' 
          ? 'translateX(-50%) rotate(45deg)' 
          : 'translateX(-50%) rotate(-135deg)';
      }
      return;
    }
    
    const anchorRect = currentAnchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edgePadding = 12;
    const popoverWidth = root.offsetWidth || 200;
    const popoverHeight = root.offsetHeight || 100;

    // Determine vertical position - flip if needed
    const spaceBelow = viewportHeight - anchorRect.bottom - gap - edgePadding;
    const spaceAbove = anchorRect.top - gap - edgePadding;
    
    let actualPosition = position;
    if (position === 'bottom' && spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
      actualPosition = 'top';
    } else if (position === 'top' && spaceAbove < popoverHeight && spaceBelow > spaceAbove) {
      actualPosition = 'bottom';
    }

    root.style.top = actualPosition === 'bottom'
      ? `${anchorRect.bottom + gap}px`
      : `${anchorRect.top - popoverHeight - gap}px`;
    root.style.bottom = 'auto';
    root.dataset.position = actualPosition;
    
    const anchorCenterX = anchorRect.left + anchorRect.width / 2;
    const minLeft = edgePadding;
    const maxLeft = viewportWidth - popoverWidth - edgePadding;
    const left = Math.max(minLeft, Math.min(maxLeft, anchorCenterX - popoverWidth / 2));
    
    root.style.left = `${left}px`;
    root.style.transform = 'none';

    if (arrowEl) {
      const arrowOffset = anchorCenterX - left;
      arrowEl.style.left = `${arrowOffset}px`;
      arrowEl.style.transform = actualPosition === 'bottom' 
        ? 'translateX(-50%) rotate(45deg)' 
        : 'translateX(-50%) rotate(-135deg)';
    }
  };

  const contentEl = el('div', {
    class: 'ui-dialog__content',
    children: content 
      ? typeof content === 'function' 
        ? content(close) 
        : !Array.isArray(content) ? [ content ] : content
      : []
  });

  let root;

  if (isModal) {
    root = el('dialog', parent, {
      ...rest,
      class: ['ui-dialog', 'ui-dialog-component', propsToClasses(props), rest.class],
      onClick: (e) => {
        const r = root.getBoundingClientRect();
        const inDialog = r.top <= e.clientY && e.clientY <= r.bottom
                        && r.left <= e.clientX && e.clientX <= r.right;
        if (!inDialog) {
          close();
        }
      },
      children: [contentEl]
    });
  } else {
    root = el('div', parent, {
      ...rest,
      class: ['ui-popover', 'ui-dialog-component', propsToClasses(props), rest.class],
      data: { open: 'false', position },
      style: _isChildOfAnchor ? { position: 'absolute' } : undefined,
      children: [
        arrow && el('div', { class: 'ui-popover__arrow', ref: (e) => arrowEl = e }),
        contentEl
      ]
    });
  }

  inverted && root.classList.add('ui-inverted');

  root.showDialog = open;
  root.hideDialog = close;
  root.toggleDialog = toggle;
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
