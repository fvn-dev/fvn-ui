import { el, col, parseArgs, configToClasses, bemFactory } from '../dom.js'
import { header } from './text.js'
import './card.css'

const bem = bemFactory('card');

/**
 * Creates a card container with optional header
 * @param {Object} config
 * @param {string} [config.title] - Card header title
 * @param {string} [config.description] - Card header description
 * @param {string|HTMLElement|HTMLElement[]|Function} [config.content] - Card body content
 * @param {boolean} [config.border=true] - Show border (set false to remove)
 * @param {number} [config.padding] - Override default padding
 * @param {string} [config.id] - Registers to dom.card[id] and dom[id]
 * @returns {HTMLDivElement} Card element
 * @example
 * card({ title: 'Settings', description: 'Configure your app' })
 * card({ title: 'Note', content: [input(), button()], border: false })
 */
export function card(...args) {
  const { 
    parent, 
    title, 
    description, 
    content,
    border = true,
    padding,
    width,
    ...rest 
  } = parseArgs(...args);

  const hasPadding = padding !== undefined;
  let bodyRef;

  const withBorder = border;
  const fullWidth = width === undefined;

  const root = el('div', parent, {
    ...rest,
    class: [
      bem(), 
      'flex', 
      'flex-col', 
      'gap', 
      fullWidth && 'w-full',
      withBorder && 'border',
      !hasPadding && 'pad-8',
      hasPadding && `pad-${padding}`,
      configToClasses(rest), 
      rest.class
    ],
    children: [
      header({ title, description, class: bem.el('header') }),
      col({ 
        class: bem.el('body'), 
        align: 'start',
        ref: (e) => bodyRef = e 
      })
    ]
  });

  if (typeof content === 'string') {
    bodyRef.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    bodyRef.appendChild(content);
  } else if (Array.isArray(content)) {
    content.forEach((c) => bodyRef.appendChild(c));
  } else if (typeof content === 'function') {
    content(bodyRef, root);
  }

  return root;
}
