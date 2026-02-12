import { el, parseArgs, propsToClasses } from '../dom.js'
import './label.css'

/**
 * Creates a label element
 * @param {string} [text] - Label text (can also be first positional arg)
 * @param {Object} [config]
 * @param {string} [config.text] - Label text
 * @param {boolean} [config.small] - Small text size
 * @param {boolean} [config.muted] - Muted text color
 * @param {string} [config.html] - HTML content (use instead of text)
 * @returns {HTMLLabelElement} Label element
 * @example
 * label('Section Title')
 * label('Helper text', { small: true, muted: true })
 * label({ html: 'Text with <a href="#">link</a>' })
 */
export function label(...args) {
  const { parent, text = '', props = {}, ...rest } = parseArgs(...args);
  
  return el('label', parent, {
    class: ['ui-label', propsToClasses(props), rest.class],
    html: rest.html || text,
    ...rest
  });
}
