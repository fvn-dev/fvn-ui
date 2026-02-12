import { el, parseArgs, propsToClasses } from '../dom.js'
import './card.css'

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
    props = {},
    ...rest 
  } = parseArgs(...args);

  const hasPadding = 'padding' in props;
  let bodyRef;

  const withBorder = Object.hasOwn(props, 'border') ? props.border : true;
  const fullWidth = !Object.hasOwn(props, 'width');

  const root = el('div', parent, {
    ...rest,
    class: [
      'ui-card', 
      'flex', 
      'flex-col', 
      'gap', 
      fullWidth && 'w-full',
      withBorder && 'border',
      !hasPadding && 'pad-8', 
      propsToClasses(props), 
      rest.class
    ],
    children: [
      (title || description) && el('div', { 
        class: 'ui-card__header flex flex-col',
        children: [
          title && el('div', { class: 'ui-card__title', text: title }),
          description && el('div', { class: 'ui-card__desc muted small', text: description })
        ]
      }), 
      el('div', { 
        class: 'ui-card__body flex flex-col gap items-start',
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
