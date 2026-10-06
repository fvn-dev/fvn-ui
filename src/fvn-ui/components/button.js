import { el, col, parseArgs, configToClasses, bemFactory } from '../dom.js'
import { dialog } from './dialog.js'
import { svg } from './svg.js'
import './button.css'

const bem = bemFactory('btn');
const TIP_DELAY_MS = 450;
const navigationKeys = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);
const focusIntents = new WeakMap();

// Track navigation for the current key event, not persistent keyboard modality.
// Programmatic focus may match :focus-visible long after a keyboard interaction.
function getFocusIntent(doc) {
  if (focusIntents.has(doc)) return focusIntents.get(doc);
  const intent = { navigating: false };
  let resetTimer;
  const reset = () => {
    clearTimeout(resetTimer);
    intent.navigating = false;
  };
  doc.addEventListener('keydown', event => {
    reset();
    if (navigationKeys.has(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey) {
      intent.navigating = true;
      resetTimer = setTimeout(reset, 0);
    }
  }, true);
  doc.addEventListener('pointerdown', reset, true);
  doc.addEventListener('keyup', reset, true);
  focusIntents.set(doc, intent);
  return intent;
}

/**
 * Creates a button element
 * @param {Object} config
 * @param {string} [config.label] - Button text (alias: text)
 * @param {string} [config.text] - Button text (alias: label)
 * @param {string|string[]} [config.icon] - Icon name or array of names to cycle through
 * @param {'default'|'primary'|'secondary'|'outline'|'ghost'|'minimal'} [config.variant='default']
 * @param {'round'} [config.shape] - Button shape
 * @param {'small'|'medium'|'large'} [config.size] - Button size
 * @param {'primary'|'red'|'green'|'blue'|'pink'|'yellow'|'orange'|string[]} [config.color] - Color or array for random
 * @param {boolean} [config.disabled] - Disabled state
 * @param {boolean} [config.muted] - Muted appearance
 * @param {string} [config.tip] - Hover/focus infotip text
 * @param {boolean} [config.tipInverted] - Use inverted infotip style
 * @param {Function} [config.onClick] - Click handler
 * @param {string} [config.id] - Registers to dom.button[id] and dom[id]
 * @returns {HTMLButtonElement} Button element with toggleLoading() and setLabel() methods
 * @example
 * button({ label: 'Save', variant: 'primary' })
 * button({ label: 'Delete', color: 'red', icon: 'trash' })
 * button({ icon: 'settings', variant: 'ghost', shape: 'round' })
 */
export function button(...args) {
  const {
    parent,
    label = '',
    description = '',
    reverse = false,
    icon,
    variant = 'default',
    shape,
    size,
    color,
    muted,
    loading,
    tip,
    tipInverted,
    badge,
    type = 'button',
    disabled,
    attrs = {},
    dataset,
    props,
    ...rest
  } = parseArgs(...args);

  const isCore = /primary|secondary/.test(variant);
  const isSub = /outline|ghost/.test(variant);
  const isMinimal = /minimal|stripped|none/.test(variant);
  const isFilled = !isSub && !isMinimal;
  
  const isColorArray = Array.isArray(color);
  const pickColor = () => isColorArray 
    ? color[Math.floor(Math.random() * color.length)] 
    : color;
  
  const initialColor = pickColor();
  const colorVal = isCore ? variant : (initialColor || 'default');
  const uiCol = isFilled ? colorVal : (initialColor && `sub-${initialColor}`);

  const icons = Array.isArray(icon) ? icon : (icon ? [icon] : []);
  const iconRefs = [];

  if (description && !icons.length) {
    icons.push('arrow-right');
  }

  const text = [
    label && el('div', { html: label }),
    description && el('div', { html: description, class: bem.el('description') })
  ];

  const btn = el('button', parent, {
    ...rest,
    type,
    disabled,
    class: [
      bem(),
      variant !== 'default' && bem(variant),
      isFilled && bem('filled'),
      isSub && bem('sub'),
      isSub && `${bem('hover')}${initialColor ? '-sub' : ''}`,
      icons.length && !label && bem('square'),
      shape && !isMinimal && bem(shape),
      size && bem.core('size', size),
      muted && bem('muted'),
      loading && 'loading',
      reverse && bem('reverse'),
      description && bem('list-item'),
      badge && bem('badge'),
      configToClasses(props),
      rest.class
    ],
    attrs,
    data: { ...dataset, uiCol },
    children: [
      icons.length && el('div', { 
        class: bem.el('icon'), 
        children: icons.map((name, i) => el('span', { 
          class: i > 0 && 'ui-hidden',
          html: svg(name),
          ref: e => iconRefs[i] = e
        }))
      }),
      description ? col(text) : text
    ],
    setLabel(text, duration) {
      this.textContent = text || label;
      if (Number.isInteger(duration)) {
        setTimeout(() => {
          this.textContent = label;
        }, duration);
      }
    },
    disable(text) {
      this.disabled = true;
      this.textContent = text || label;
    },
    enable() {
      this.disabled = false;
      this.textContent = label;
    },    
    toggleLoading(text) {
      const isLoading = this.classList.toggle('loading', typeof text === 'string');
      this.textContent = text || label;
      this.disabled = isLoading;
    }
  });

  const clickHandlers = [];

  if (isColorArray) {
    clickHandlers.push(() => {
      const newColor = pickColor();
      btn.dataset.uiCol = isFilled 
        ? (isCore ? variant : (newColor || 'default'))
        : (newColor && `sub-${newColor}`);
    });
  }

  if (icons.length > 1) {
    let idx = 0;
    clickHandlers.push(() => {
      iconRefs[idx].classList.add('ui-hidden');
      idx = (idx + 1) % icons.length;
      iconRefs[idx].classList.remove('ui-hidden');
    });
  }

  if (clickHandlers.length) {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      clickHandlers.forEach(h => h());
    });
  }

  if (tip) {
    const focusIntent = getFocusIntent(btn.ownerDocument);
    let showTimer = null;
    let tipDialog = null;

    const clearShowTimer = () => {
      if (!showTimer) return;
      clearTimeout(showTimer);
      showTimer = null;
    };

    const ensureTipDialog = () => {
      if (tipDialog) return tipDialog;
      tipDialog = dialog({
        type: 'tooltip',
        anchor: btn,
        hover: true,
        scrollPolicy: 'close',
        padding: 0,
        inverted: tipInverted,
        content: el('div', {
          class: bem.el('tip'),
          text: tip
        })
      });
      return tipDialog;
    };

    const showTip = () => {
      if (btn.disabled) return;
      ensureTipDialog().show(btn);
    };

    const hideTip = () => {
      clearShowTimer();
      tipDialog?.hide?.();
    };

    btn.addEventListener('mouseenter', () => {
      clearShowTimer();
      showTimer = setTimeout(showTip, TIP_DELAY_MS);
    });

    btn.addEventListener('mouseleave', hideTip);
    btn.addEventListener('focus', () => {
      if (focusIntent.navigating && btn.matches(':focus-visible')) showTip();
    });
    btn.addEventListener('blur', hideTip);
    btn.addEventListener('pointerdown', hideTip);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideTip();
    });
  }

  return btn;
}
