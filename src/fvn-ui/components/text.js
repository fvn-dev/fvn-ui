import { el, col, parseArgs, propsToClasses } from '../dom.js'
import './text.css'

/**
 * Creates a title element (h1 for large, div otherwise)
 * @param {string} [content] - Title text
 * @param {Object} [config]
 * @param {boolean} [config.large] - Use h1 tag (dashboard style)
 * @param {string} [config.class] - Additional classes
 * @returns {HTMLElement}
 * @category Layout
 */
export const title = (...args) => {
  const { parent, text = '', large, props = {}, ...rest } = parseArgs(...args);
  const tag = large ? 'h1' : 'div';
  
  return el(tag, parent, {
    ...rest,
    class: ['ui-title', large && 'ui-title--large', propsToClasses(props), rest.class],
    html: rest.html || text
  });
};

/**
 * Creates a description/subtitle element
 * @param {string} [content] - Description text
 * @param {Object} [config]
 * @param {boolean} [config.small] - Smaller text size
 * @param {string} [config.class] - Additional classes
 * @returns {HTMLElement}
 * @category Layout
 */
export const description = (...args) => {
  const { parent, text = '', small = true, props = {}, ...rest } = parseArgs(...args);
  
  return el('p', parent, {
    ...rest,
    class: ['ui-description', 'muted', small && 'small', propsToClasses(props), rest.class],
    html: rest.html || text
  });
};

/**
 * Creates a label element
 * @param {string} [content] - Label text
 * @param {Object} [config]
 * @param {boolean} [config.soft] - Softer/muted style
 * @param {boolean} [config.small] - Small text size
 * @param {boolean} [config.muted] - Muted text color
 * @param {string} [config.class] - Additional classes
 * @returns {HTMLLabelElement}
 * @category Layout
 */
export const label = (...args) => {
  const { parent, text = '', soft, props = {}, ...rest } = parseArgs(...args);
  
  return el('label', parent, {
    ...rest,
    class: ['ui-label', soft && 'ui-label--soft', 'block-1', propsToClasses(props), rest.class],
    html: rest.html || text
  });
};

/**
 * Creates a header group with title and optional description
 * @param {Object} config
 * @param {string} [config.title] - Title text
 * @param {string} [config.description] - Description text
 * @param {boolean} [config.large] - Large title style
 * @param {string} [config.class] - Additional classes
 * @returns {HTMLDivElement}
 * @category Layout
 */
export const header = (...args) => {
  const { 
    parent, 
    title: titleText, 
    description: descText, 
    large,
    gap = 2,
    ...rest 
  } = parseArgs(...args);
  
  if (!titleText && !descText) return null;
  
  return col(parent, {
    ...rest,
    gap,
    class: ['ui-header', rest.class],
    children: [
      titleText && title(titleText, { large }),
      descText && description(descText)
    ].filter(Boolean)
  });
};

// Text primitives namespace
export const text = {
  title,
  description,
  label,
  header
};

export default text;
