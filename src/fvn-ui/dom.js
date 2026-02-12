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

export const dom = {};
export const colors = ['default', 'primary', 'blue', 'green', 'pink', 'red', 'orange', 'yellow'];

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
    .filter(([, val]) => val !== undefined && val !== null && val !== false)
    .map(([key, val]) => {
      const prefix = CLASS_SHORTHANDS[key] || key;
      return val === true ? prefix : `${prefix}-${val}`;
    });
};

/**
 * Convert shorthand config props to CSS classes.
 * Use this when you want shorthands like gap, padding to become utility classes.
 * @param {Object} config - The config object with potential shorthands
 * @param {string[]} [exclude] - Props to exclude (already handled programmatically)
 * @returns {string[]} Array of CSS class names
 * @private
 */
export const configToClasses = (config, exclude = []) => {
  if (!config) return [];
  return Object.entries(config)
    .filter(([key, val]) => 
      key in CLASS_SHORTHANDS && 
      !exclude.includes(key) &&
      val !== undefined && val !== null && val !== false
    )
    .map(([key, val]) => {
      const prefix = CLASS_SHORTHANDS[key];
      return val === true ? prefix : `${prefix}-${val}`;
    });
};

export const parseArgs = (...args) => {
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
      merge(settings, arg);
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

/**
 * Creates a DOM element with flexible argument order
 * @param {string} tag - HTML tag name or HTML string (e.g. 'div' or '<div class="foo">')
 * @param {Node} [parent] - Parent element to append to
 * @param {Object} [config] - Element configuration
 * @param {string|string[]} [config.class] - CSS class(es)
 * @param {string} [config.text] - Text content
 * @param {string} [config.html] - HTML content
 * @param {Object} [config.style] - Inline styles
 * @param {Object} [config.data] - Data attributes
 * @param {Object} [config.attrs] - HTML attributes
 * @param {Node[]} [config.children] - Child elements
 * @param {Function} [config.ref] - Callback receiving the created element
 * @param {Function} [config.onClick] - Click handler (also onInput, onChange, etc.)
 * @returns {HTMLElement} The created element
 * @category Layout
 * @example
 * el('div', { class: 'card', text: 'Hello' })
 * el('button', document.body, { text: 'Click me', onClick: handleClick })
 * el('<input type="text">', { placeholder: 'Name' })
 */
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
    // Convert shorthand props to classes
    const shorthandClasses = configToClasses(config);
    if (shorthandClasses.length) {
      config = { ...config, class: [config.class, ...shorthandClasses] };
    }
    
    patch(node, config, state);
  }
  if (state.parent) {
    state.parent.appendChild(node);
  }

  if (node.id) {
    dom[node.id] = node;
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
    parent, count, justify, align, gap = 2, padding, inline, block, flex, full, children, width,
    ...rest 
  } = opts;

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
      width && (width === 'full' ? 'w-full' : `w-${width}`),
      rest.class
    ],
    children
  });
};

/**
 * Creates a horizontal flex row layout
 * @param {Node} [parent] - Parent element to append to
 * @param {Object} [config] - Layout configuration
 * @param {Node[]} [config.children] - Child elements (also accepts array as second arg)
 * @param {string} [config.justify='start'] - Justify content (start, center, end, between, around)
 * @param {string} [config.align='center'] - Align items (start, center, end, stretch)
 * @param {number} [config.gap=2] - Gap between children (0-10)
 * @param {boolean} [config.full] - Full viewport height, centered
 * @param {number} [config.flex] - Apply flex-N to all children
 * @returns {HTMLDivElement} Flex container element
 * @category Layout
 * @example
 * layout.row([button('One'), button('Two')])
 * layout.row({ gap: 4, justify: 'between' }, [left, right])
 */
export const row = (...args) => createLayout('row', { justify: 'start', align: 'center' }, ...args);

/**
 * Creates a vertical flex column layout
 * @param {Node} [parent] - Parent element to append to
 * @param {Object} [config] - Layout configuration
 * @param {Node[]} [config.children] - Child elements (also accepts array as second arg)
 * @param {string} [config.justify='start'] - Justify content (start, center, end, between, around)
 * @param {string} [config.align='start'] - Align items (start, center, end, stretch)
 * @param {number} [config.gap=2] - Gap between children (0-10)
 * @param {boolean} [config.full] - Full viewport height, centered
 * @param {number} [config.flex] - Apply flex-N to all children
 * @returns {HTMLDivElement} Flex container element
 * @category Layout
 * @example
 * layout.col([input({ label: 'Name' }), input({ label: 'Email' })])
 * layout.col({ gap: 6, align: 'center' }, [title, content, footer])
 */
export const col = (...args) => createLayout('col', { justify: 'start', align: 'start' }, ...args);

export const layout = { row, col, column: col };