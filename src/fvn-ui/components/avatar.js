import { el, parseArgs, configToClasses } from '../dom.js'
import { image } from './image.js'
import './text.css'
import './avatar.css'

const getInitials = (name) => {
  if (!name) {
    return '';
  }
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts.at(-1)[0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

/**
 * Creates an avatar with image or initials fallback
 * @param {Object} config
 * @param {string} [config.src] - Image URL
 * @param {string} [config.name] - Name (used for initials fallback and alt text)
 * @param {string} [config.description] - Description text below name
 * @param {'round'|'square'} [config.variant='round'] - Avatar shape
 * @param {'small'|'medium'|'large'} [config.size='small'] - Avatar size
 * @param {'primary'|'red'|'green'|'blue'|'pink'} [config.color] - Background color for initials
 * @param {string} [config.id] - Registers to dom.avatar[id] and dom[id]
 * @returns {HTMLDivElement} Avatar element
 * @example
 * avatar({ name: 'John Doe', description: 'Admin', color: 'blue' })
 * avatar({ src: 'photo.jpg', name: 'Jane', size: 'large', variant: 'square' })
 */
export function avatar(...args) {
  const {
    parent,
    src,
    name,
    description,
    variant = 'round',
    size = 'small',
    color,
    ...rest
  } = parseArgs(...args);

  const initials = getInitials(name);

  return el('div', parent, {
    ...rest,
    class: ['ui-avatar', variant !== 'square' && 'ui-avatar--round', size && `ui-avatar--${size}`, configToClasses(rest), rest.class],
    children: [
      el('div', {
        class: 'ui-avatar__box',
        data: { uiCol: color || (src ? null : 'primary') },
        children: [
          src ? image({ src, alt: name || '', class: 'ui-avatar__image' }) : null,
          !src && initials && el('span', { class: 'ui-avatar__fallback', text: initials })
        ]
      }),
      (name || description) && el('div', {
        class: 'ui-avatar__info',
        children: [
          name && el('span', { class: 'ui-name', text: name }),
          description && el('span', { class: 'ui-subtitle', text: description })
        ]
      })
    ]
  });
}
