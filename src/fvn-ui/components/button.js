import { el, parseArgs, configToClasses, bemFactory } from '../dom.js'
import { svg } from './svg.js'
import './button.css'

/**
 * Creates a button element
 * @param {Object} config
 * @param {string} [config.label] - Button text (alias: text)
 * @param {string} [config.text] - Button text (alias: label)
 * @param {string} [config.icon] - Icon name from svg.js
 * @param {'default'|'primary'|'secondary'|'outline'|'ghost'|'minimal'} [config.variant='default']
 * @param {'round'} [config.shape] - Button shape
 * @param {'small'|'medium'|'large'} [config.size] - Button size
 * @param {'primary'|'red'|'green'|'blue'|'pink'|'yellow'|'orange'|string[]} [config.color] - Color or array for random
 * @param {boolean} [config.disabled] - Disabled state
 * @param {boolean} [config.muted] - Muted appearance
 * @param {Function} [config.onClick] - Click handler
 * @param {string} [config.id] - Registers to dom.button[id] and dom[id]
 * @returns {HTMLButtonElement} Button element with toggleLoading() and setLabel() methods
 * @example
 * button({ label: 'Save', variant: 'primary' })
 * button({ label: 'Delete', color: 'red', icon: 'trash' })
 * button({ icon: 'settings', variant: 'ghost', shape: 'round' })
 */

const bem = bemFactory('btn');

export function button(...args) {
  const {
    parent,
    label = '',
    icon,
    variant = 'default',
    shape,
    size,
    color,
    muted,
    type = 'button',
    disabled,
    attrs = {},
    dataset,
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
      icon && !label && bem('square'),
      shape && !isMinimal && bem(shape),
      size && bem.core('size', size),
      muted && bem('muted'),
      configToClasses(rest),
      rest.class
    ],
    attrs,
    data: { ...dataset, uiCol },
    children: [
      icon && el('div', { class: bem.el('icon'), html: svg(icon) }),
      label && el('div', { html: label })
    ],
    setLabel(text, duration = 5000) {
      this.disabled = true;
      this.textContent = text;
      if (duration) {
        setTimeout(() => {
          this.disabled = false;
          this.textContent = label;
        }, duration);
      }
    },
    toggleLoading(text) {
      this.classList.toggle('loading', !!text);
      this.textContent = text || label;
    }
  });

  if (isColorArray) {
    btn.addEventListener('click', () => {
      const newColor = pickColor();
      btn.dataset.uiCol = isFilled 
        ? (isCore ? variant : (newColor || 'default'))
        : (newColor && `sub-${newColor}`);
    });
  }

  return btn;
}
