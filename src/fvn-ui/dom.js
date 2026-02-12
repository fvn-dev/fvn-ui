/*
  el()

  Accepts arguments in any order and returns a DOM element:

    [required] string: tag or html ('<div>hey</div>') or text content
    [optional] string: text content if first string is a tag
    [optional] parent: DOM node to append to
    [optional] config: object with properties below
  
  Examples:
    el('<h3>hey</h3>')                           // from HTML string
    el('<h3>hey</h3>', document.body)            // append to parent
    el('div', { class: 'foo', text: 'Hello' })   // tag + config
    el('div', 'hello')                           // tag + text shorthand
    el.create.div({ class: 'foo' })              // tag proxy

  Config options:
    class | className | classList  - string | array | object → adds classes
    text                           - string → sets textContent (safe)
    html                           - string → sets innerHTML (trusted only)
    data | dataset                 - object → data-* attributes
    attrs | attributes             - object → element attributes
    style                          - object → inline styles & CSS vars
    aria                           - object → aria-* attributes
    on[Event]                      - function → event handler
    children                       - array → append child nodes/text
    ref                            - function(el) → immediate callback
    ready                          - function(el) → callback after rAF
    inserted                       - function(el) → callback when in DOM
    parent                         - node → alternative to arg
    [anything else]                - assigned directly to element

  Exports:
    el, row, col, layout, dom, patch, parseArgs, toClassList,
    escapeHtml, onOutsideClick, withValue, getCallback
*/

import { merge } from './helpers.js'

// ---- Helpers ----

export const escapeHtml = (s) => String(s)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const onOutsideClick = (target, callback) => {
  const handler = (e) => {
    if (!target.contains(e.target)) {
      callback(e);
    }
  };
  document.addEventListener('mousedown', handler, true);
  return () => document.removeEventListener('mousedown', handler, true);
};

export const withValue = (element, getter, setter) => {
  element.getValue = getter;
  element.setValue = setter;
  Object.defineProperty(element, 'value', { get: getter, set: setter });
  return element;
};

export const getCallback = (preferred, obj) =>
  obj[preferred] || obj[preferred.toLowerCase()] || obj.callback || obj.cb;

// ---- parseArgs for components ----

const CLASS_SHORTHANDS = { 
  width: 'w',
  padding: 'pad', 
  border: 'border', 
  gap: 'gap', 
  margin: 'margin', 
  shade: 'shade', 
  flex: 'flex',
  block: 'block',
  inline: 'inline',
  small: 'small',
  muted: 'muted'
};

// Convert props object to class array (e.g. { padding: 4, border: true } → ['pad-4', 'border'])
export const propsToClasses = (props) => {
  if (!props) return [];
  return Object.entries(props)
    .filter(([, val]) => val) // Skip falsy values
    .map(([key, val]) => {
      const prefix = CLASS_SHORTHANDS[key] || key;
      return val === true ? prefix : `${prefix}-${val}`;
    });
};

const applyShorthands = (settings, obj) => {
  settings.props ||= {};
  for (const key in CLASS_SHORTHANDS) {
    if (!(key in obj)) continue;
    settings.props[key] = obj[key];
    delete obj[key]; // Remove from obj so it doesn't end up in ...rest
  }
  merge(settings, obj);
};

/**
 * Parse component arguments in any order.
 * @param {Object} options - Parsing options
 * @param {Object} options.defaults - Default values
 * @param {'text'|'justify'} options.stringAs - How to interpret string args
 * @param {'merge'|'children'} options.arrayAs - How to interpret array args
 * @param {boolean} options.numberAs - Property name for number args (e.g., 'count')
 * @param {...any} args - Arguments to parse
 */
export const parseArgs = (...args) => {
  // Check if first arg is options object with parsing config
  const firstIsOptions = args[0]?.defaults !== undefined 
                         || args[0]?.stringAs !== undefined 
                         || args[0]?.arrayAs !== undefined;
  
  const options = firstIsOptions ? args.shift() : {};
  const { 
    defaults = {}, 
    stringAs = 'text', 
    arrayAs = 'merge',
    numberAs = null 
  } = options;

  const settings = { ...defaults };
  
  for (const arg of args) {
    if (!arg) {
      continue;
    }
    if (arg instanceof Node) {
      settings.parent = arg;
      continue;
    }
    if (typeof arg === 'number' && numberAs) {
      settings[numberAs] = arg;
      continue;
    }
    if (typeof arg === 'string') {
      if (stringAs === 'justify') {
        arg === 'full' ? (settings.full = true) : (settings.justify = arg);
      } else {
        settings.text = arg;
      }
      continue;
    }
    if (Array.isArray(arg)) {
      arrayAs === 'children' ? (settings.children = arg) : merge(settings, arg);
      continue;
    }
    if (typeof arg === 'object') {
      applyShorthands(settings, arg);
    }
  }
  return settings;
};

// ---- Class utilities ----

export const toClassList = (value) => {
  if (!value) {
    return [];
  }
  if (typeof value === 'string') {
    return value.split(' ').filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.flatMap(toClassList);
  }
  return Object.keys(value).filter((k) => value[k]);
};

// ---- Patch handlers ----

const patchHandlers = {
  text: (el, v) => { el.textContent = String(v); },
  html: (el, v) => { el.innerHTML = String(v); },
  style: (el, v) => {
    for (const prop in v) {
      prop[0] === '-' 
        ? el.style.setProperty(prop, v[prop]) 
        : (el.style[prop] = v[prop]);
    }
  },
  data: (el, v) => { for (const k in v) el.dataset[k] = v[k]; },
  dataset: (el, v) => { for (const k in v) el.dataset[k] = v[k]; },
  aria: (el, v) => { for (const k in v) el.setAttribute(`aria-${k}`, v[k]); },
  children: (el, v) => {
    for (const child of v.flat()) {
      if (child) {
        el.append(child instanceof Node ? child : String(child));
      }
    }
  },
  ref: (el, v) => v.call(el, el),
  ready: (el, v) => requestAnimationFrame(() => v(el)),
};

export const patch = (node, source, state = {}) => {
  // Collect and apply all class sources
  const classes = [
    ...toClassList(source.classList),
    ...toClassList(source.className),
    ...toClassList(source.class)
  ];
  for (const c of classes) {
    node.classList.add(c);
  }

  // Process children first so ref/ready can query them
  if (source.children) {
    patchHandlers.children(node, source.children);
  }

  for (const key in source) {
    const val = source[key];
    
    // Skip nullish values, class props (already handled), and children (handled above)
    if (val == null || key.startsWith('class') || key === 'children') {
      continue;
    }

    // Skip ref/ready - process last
    if (key === 'ref' || key === 'ready') {
      continue;
    }

    // Parent reference
    if (key === 'parent') {
      state.parent = val;
      continue;
    }

    // Attributes object
    if (key.startsWith('attr')) {
      for (const attr in val) {
        node.setAttribute(attr, String(val[attr]));
      }
      continue;
    }

    // Event handlers
    if (key.startsWith('on') && typeof val === 'function') {
      node[key.toLowerCase()] = val;
      continue;
    }

    // Inserted callback - fires when element enters DOM
    if (key === 'inserted') {
      if (node.isConnected) {
        requestAnimationFrame(() => val(node));
        continue;
      }
      const obs = new MutationObserver(() => {
        if (!node.isConnected) {
          return;
        }
        obs.disconnect();
        val(node);
      });
      obs.observe(state.parent?.isConnected ? state.parent : document, { 
        childList: true, 
        subtree: true 
      });
      continue;
    }

    // Known patch handlers (except children/ref/ready which are handled specially)
    if (patchHandlers[key]) {
      patchHandlers[key](node, val);
      continue;
    }

    // Default: assign directly to element
    node[key] = val;
  }

  // Process ref/ready last so they can access children
  if (source.ref) {
    patchHandlers.ref(node, source.ref);
  }
  if (source.ready) {
    patchHandlers.ready(node, source.ready);
  }

  return node;
};

// ---- el() ----

const template = document.createElement('template');

export function el(...args) {
  let str, txtArg, parent, config;

  for (const arg of args) {
    if (!arg) {
      continue;
    }
    if (typeof arg === 'string') {
      str ? (txtArg = arg) : (str = arg);
      continue;
    }
    if (arg instanceof Node) {
      parent = arg;
      continue;
    }
    if (typeof arg === 'object') {
      config = arg;
    }
  }

  str ||= '<mark>Misconfigured el</mark>';

  let node;
  if (str.includes('<')) {
    template.innerHTML = str.trim();
    node = template.content.firstElementChild.cloneNode(true);
  } else {
    node = document.createElement(str);
  }

  if (txtArg) {
    node.textContent = txtArg;
  }
  
  const state = { parent };
  if (config) {
    // Process CLASS_SHORTHANDS (padding, width, etc.) → props
    const processed = {};
    applyShorthands(processed, config);
    
    // Convert props to classes and merge into class array
    if (processed.props && Object.keys(processed.props).length) {
      processed.class = [processed.class, ...propsToClasses(processed.props)];
    }
    
    patch(node, processed, state);
  }
  if (state.parent) {
    state.parent.appendChild(node);
  }

  return node;
}

// Tag proxy: el.create.div({ class: 'foo' })
el.create = new Proxy({}, {
  get: (_, tag) => (config, parent) => el(tag, config, parent)
});

// ---- Layout helpers ----

const LAYOUT_PARSE_OPTIONS = { 
  stringAs: 'justify', 
  arrayAs: 'children', 
  numberAs: 'count' 
};

const createLayout = (direction, defaults, ...args) => {
  const isRow = direction === 'row';
  const opts = parseArgs({ ...LAYOUT_PARSE_OPTIONS, defaults }, ...args);
  
  let { 
    parent, count, justify, align, items, gap, padding, inline, block, flex, full, children,
    props = {},
    ...rest 
  } = opts;

  // Support both 'align' and 'items' for flex align-items
  align = align || items;

  // Default gap if not specified (check props for explicit gap)
  const hasGap = 'gap' in props;
  gap = hasGap ? undefined : (gap ?? 2);

  if (full) {
    justify = 'center';
    align = 'center';
  }

  // Process passed children
  if (children) {
    children = children.flat();
    if (Number.isInteger(flex)) {
      for (const child of children) {
        child.classList.add(`flex-${flex}`);
      }
    }
  }

  // Generate placeholder children if count provided
  if (!children && count > 0) {
    const space = padding || inline || block;
    const spacePrefix = (padding && 'pad') || (inline && 'inline') || (block && 'block');
    
    children = Array.from({ length: count }, (_, i) => 
      el('div', { 
        class: [
          'flex',
          isRow && 'align-center',
          !isRow && 'flex-col',
          space && `${spacePrefix}-${space}`,
          !isNaN(gap) && `gap-${gap}`,
          Number.isInteger(flex) && `flex-${flex}`,
          isRow && count === 2 && (i === count - 1 ? 'justify-end' : 'justify-start')
        ]
      })
    );
  }

  return el('div', parent, {
    ...rest,
    class: [
      direction,
      'flex',
      !isRow && 'flex-col',
      `align-${flex ? 'stretch' : align}`,
      `justify-${justify}`,
      !isNaN(gap) && `gap-${gap}`,
      full && 'min-h-screen',
      propsToClasses(props),
      rest.class
    ],
    children
  });
};

export const row = (...args) => createLayout('row', { justify: 'start', align: 'center' }, ...args);
export const col = (...args) => createLayout('col', { justify: 'start', align: 'start' }, ...args);
export const layout = { row, col };

export const dom = {};

export const colors = ['primary', 'red', 'blue', 'green', 'pink', 'yellow', 'orange', 'default'];