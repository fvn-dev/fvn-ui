import { layout } from './dom.js'
import { 
  avatar, button, card, checkbox, collapsible, confirm, 
  dialog, image, input, label, radioGroup, selectComponent, 
  switchComponent, tabs 
} from './components/index.js'

// Component registry
const COMPONENTS = {
  'ui-row': (props, children) => layout.row(children, props),
  'ui-col': (props, children) => layout.col(children, props),
  'ui-avatar': (props) => avatar(props),
  'ui-button': (props) => button(props),
  'ui-card': (props, children) => card({ ...props, content: children }),
  'ui-checkbox': (props) => checkbox(props),
  'ui-collapsible': (props, children) => collapsible({ ...props, content: children }),
  'ui-confirm': (props) => confirm(props),
  'ui-dialog': (props, children) => dialog({ ...props, content: children }),
  'ui-image': (props) => image(props),
  'ui-input': (props) => input(props),
  'ui-label': (props) => label(props),
  'ui-radio': (props) => radioGroup(props),
  'ui-select': (props) => selectComponent(props),
  'ui-switch': (props) => switchComponent(props),
  'ui-tabs': (props) => tabs(props),
};

const TAGS = Object.keys(COMPONENTS).join(', ');

// Parse attribute value (handles booleans, numbers, JSON)
const parseValue = (val) => {
  if (val === '' || val === 'true') return true;
  if (val === 'false') return false;
  if (!isNaN(val) && val !== '') return Number(val);
  if (val.startsWith('{') || val.startsWith('[')) {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
};

// Extract props from element attributes
const getProps = (el) => {
  const props = {};
  for (const attr of el.attributes) {
    const name = attr.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    props[name] = parseValue(attr.value);
  }
  return props;
};

// Process a single element recursively
const processElement = (el) => {
  const tag = el.tagName.toLowerCase();
  const factory = COMPONENTS[tag];
  
  if (!factory) {
    for (const child of [...el.children]) {
      const result = processElement(child);
      if (result && result !== child) child.replaceWith(result);
    }
    return el;
  }

  // Process children first (depth-first)
  const children = [];
  for (const child of [...el.childNodes]) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const processed = processElement(child);
      if (processed) children.push(processed);
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
      children.push(document.createTextNode(child.textContent));
    }
  }

  return factory(getProps(el), children);
};

/**
 * Process all ui-* elements within a container
 */
export const processTemplates = (container = document.body) => {
  const topLevel = [...container.querySelectorAll(TAGS)]
    .filter(el => !el.parentElement.closest(TAGS));

  const processed = [];
  for (const el of topLevel) {
    const result = processElement(el);
    if (result && result !== el) {
      result.classList.add('ui-pending', 'ui-fadein');
      el.replaceWith(result);
      processed.push(result);
    }
  }

  // Trigger fade-in after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      for (const el of processed) el.classList.remove('ui-pending');
    });
  });
};

/**
 * Tagged template literal for inline template creation
 * @example
 * const ui = template`<ui-row gap="2"><ui-button text="Hello"></ui-button></ui-row>`;
 * document.body.appendChild(ui);
 */
export const template = (strings, ...values) => {
  const html = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
  const temp = document.createElement('div');
  temp.innerHTML = html.trim();
  
  for (const child of [...temp.children]) {
    const result = processElement(child);
    if (result && result !== child) child.replaceWith(result);
  }
  
  if (temp.children.length === 1) return temp.firstElementChild;
  
  const frag = document.createDocumentFragment();
  while (temp.firstChild) frag.appendChild(temp.firstChild);
  return frag;
};

/**
 * Auto-process on DOMContentLoaded
 */
export const autoProcess = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => processTemplates());
  } else {
    processTemplates();
  }
};
