import { el } from '../dom.js'
import { button } from './button.js'
import './fullscreen.css';

/**
 * Makes an element fullscreen in an overlay, restoring on close.
 * @param {HTMLElement} target - The element to fullscreen.
 * @param {Object} [opts]
 * @param {Function} [opts.onClose] - Callback when closed.
 * @returns {HTMLElement} The overlay element.
 */
export function fullscreen(target, opts = {}) {
  if (!target || !(target instanceof HTMLElement)) return;
  if (target._isFullscreen) {
    const overlay = target.parentElement?.classList?.contains('ui-fullscreen-overlay') ? target.parentElement : null;
    if (overlay && typeof overlay.close === 'function') {
      overlay.close();
    }
    return;
  }

  const overlay = el('div', { class: 'ui-fullscreen-overlay' });

  opts.closeButton !== false && button(overlay, {
    icon: 'x',
    variant: 'ghost',
    shape: 'round',
    tip: opts.tip || 'Close fullscreen',
    class: 'ui-fullscreen-close',
    onClick: () => close()
  });

  const originalParent = target.parentElement;
  const nextSibling = target.nextSibling;
  target._isFullscreen = true;

  target.classList.add('ui-fullscreen-content');
  overlay.appendChild(target);
  document.body.appendChild(overlay);
  document.body.classList.add('ui-fullscreen-active');

  function onKeydown(e) {
    if (e.key === 'Escape') {
      close();
    }
  }
  document.addEventListener('keydown', onKeydown, true);

  function close() {
    if (!target._isFullscreen) return;
    overlay.remove();
    document.removeEventListener('keydown', onKeydown, true);
    if (originalParent) {
      if (nextSibling && nextSibling.parentNode === originalParent) {
        originalParent.insertBefore(target, nextSibling);
      } else {
        originalParent.appendChild(target);
      }
    }
    target.classList.remove('ui-fullscreen-content');
    target._isFullscreen = false;
    document.body.classList.remove('ui-fullscreen-active');
    if (opts.onClose) opts.onClose();
  }

  overlay.close = close;
  return overlay;
}