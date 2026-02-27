import { el, col, parseArgs, configToClasses } from '../dom.js'
import './text.css'

const htmlOrText = str => {
  return str.includes('<') ? { html: str } : { text: str };
};

const appendChildren = (node, children) => {
  if (!children) return;
  for (const child of children.flat()) {
    if (child) {
      node.append(child instanceof Node ? child : String(child));
    }
  }
};

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
  const { parent, text = '', large, props, children, ...rest } = parseArgs(...args);
  const tag = large ? 'h1' : 'div';

  const node = el(tag, parent, {
    ...rest,
    class: ['ui-title', large && 'ui-title--large', configToClasses(props), rest.class],
    ...htmlOrText(text)
  });

  appendChildren(node, children);
  return node;
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
  const { parent, text = '', small = true, props, children, ...rest } = parseArgs(...args);

  const node = el('span', parent, {
    ...rest,
    class: ['ui-description', 'muted', small && 'small', configToClasses(props), rest.class],
    ...htmlOrText(text)
  });

  appendChildren(node, children);
  return node;
};

/**
 * Creates a label element
 * @param {string} [content] - Label text
 * @param {Object} [config]
 * @param {boolean} [config.soft] - Softer/muted style
 * @param {boolean} [config.small] - Small text size
 * @param {boolean} [config.muted] - Muted text color
 * @param {'start'|'center'|'end'} [config.align] - Text alignment
 * @param {string} [config.class] - Additional classes
 * @returns {HTMLLabelElement}
 * @category Layout
 */
export const label = (...args) => {
  const { parent, text = '', soft, align, props, children, ...rest } = parseArgs(...args);

  const node = el('label', parent, {
    ...rest,
    class: ['ui-label', soft && 'ui-label--soft', 'block-1', configToClasses(props), rest.class],
    data: { ...rest.data, align },
    ...htmlOrText(text)
  });

  appendChildren(node, children);
  return node;
};

/**
 * Creates a divider/spacer element
 * @param {Object} [config]
 * @param {boolean} [config.vertical] - Vertical orientation (for use in rows)
 * @param {string} [config.class] - Additional classes
 * @returns {HTMLElement}
 * @category Layout
 */
export const divider = (...args) => {
  const { parent, vertical, ...rest } = parseArgs(...args);
  
  return el('div', parent, {
    ...rest,
    class: ['ui-divider', vertical && 'ui-divider--vertical', rest.class]
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
  header,
  divider
};

export default text;
