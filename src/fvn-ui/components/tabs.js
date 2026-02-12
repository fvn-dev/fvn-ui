import { el, getCallback, withValue, parseArgs, propsToClasses } from '../dom.js'
import { BASE_CLASS } from './index.js'
import { button } from './button.js'
import './tabs.css'

const getItemValue = (item) => {
  if (!item) {
    return '';
  }
  return item.value !== undefined ? String(item.value) : String(item.label);
};

/**
 * Creates a tabbed interface
 * @param {Object} config
 * @param {{label: string, value?: string, icon?: string, render?: Function}[]} config.items - Tab items
 * @param {number} [config.active=0] - Initially active tab index
 * @param {string} [config.value] - Initially active tab value
 * @param {'default'|'outline'|'border'|'minimal'|'ghost'} [config.variant] - Tab style
 * @param {'primary'|'red'|'green'|'blue'} [config.color] - Tab color
 * @param {'round'} [config.shape] - Tab button shape
 * @param {boolean} [config.center] - Center tabs
 * @param {boolean} [config.shade] - Shaded background
 * @param {Function} [config.onChange] - Called with (value, item)
 * @returns {HTMLDivElement} Tabs element with .value getter/setter
 * @example
 * tabs({ variant: 'outline', items: [{ label: 'Tab 1', render: () => content1 }] })
 * @see buttonGroup - Alias for tabs without content panel
 */
export function tabs(...args) {
  const {
    parent,
    items: passedItems = [],
    active = 0,
    value,
    variant,
    color,
    shape,
    appendButtons,
    appendContent,
    border,
    shade,
    padding,
    width,
    props = {},
    asButtonGroup,
    ...rest
  } = parseArgs(...args);

  const cb = getCallback('onChange', rest);
  const items = passedItems.flat();
  const tabBtns = [];

  const isCentered = rest.align === 'center' || rest.center;
  const isColorizable = ['border', 'ghost'].includes(variant);
  const buttonVariant = variant === 'border' ? 'outline' : (variant || 'none');
  const withBorder = border !== false && /outline|border/.test(variant);
  const withShade = shade;
  const hasPadding = padding !== undefined;
  const hasWidth = width !== undefined;

  let output;
  let current = value || getItemValue(items[active]) || '';

  const renderPanel = (v) => {
    output.innerHTML = '';    
    const item = items.find((o) => getItemValue(o) === String(v));
    if (!item?.render) {
      return;
    }

    const out = item.render();
    const tab = el('div', { class: 'ui-tabs__tab' });
    
    if (typeof out === 'string') {
      tab.innerHTML = out;
    } else if (Array.isArray(out)) {
      for (const o of out) tab.appendChild(o);
    } else {
      tab.appendChild(out);
    }

    output.appendChild(tab);
  };

  const setActive = (v, skipCallback) => {
    current = String(v);
    for (const btn of tabBtns) {
      const isActive = btn.dataset.value === current;
      btn.setAttribute('aria-selected', isActive);
      const item = items.find((o) => getItemValue(o) === btn.dataset.value) || {};
      const col = item.color || color;
      btn.dataset.uiCol = isActive && col && isColorizable
        ? `${variant !== 'ghost' ? 'sub-' : ''}${col}` 
        : '';
      btn.tabIndex = isActive ? 0 : -1;
    }
    !asButtonGroup && renderPanel(current);
    !skipCallback && cb?.(current);
  };

  const focusTabAt = (i) => {
    if (!tabBtns.length) {
      return;
    }
    tabBtns[(i + tabBtns.length) % tabBtns.length].focus();
  };

  const handleKeydown = (e, idx, val) => {
    const keys = {
      ArrowRight: () => focusTabAt(idx + 1),
      ArrowLeft: () => focusTabAt(idx - 1),
      Home: () => focusTabAt(0),
      End: () => focusTabAt(tabBtns.length - 1),
      Enter: () => setActive(val),
      ' ': () => setActive(val)
    };
    
    const action = keys[e.key];
    if (!action) {
      return;
    }
    e.preventDefault();
    action();
  };

  const root = el('div', parent, {
    ...rest,
    class: [ 
      BASE_CLASS, 
      'ui-tabs', 
      shape && `ui-tabs--${shape}`,
      !hasWidth && 'w-full', 
      'flex', 
      'flex-col', 
      !withBorder && 'gap-2',
      withShade && 'ui-tabs--shade',
      propsToClasses(props),
      rest.class
    ],
    children: [
      el('div', {
        class: [
          'ui-tabs__buttons', 
          `ui-tabs--${variant || 'default'}`,
          isCentered && ['justify-center', 'ma'],
        ],
        attrs: { role: 'tablist' },
        children: items.map((o, i) => {
          const val = getItemValue(o);
          const btn = button({
            variant: buttonVariant,
            label: o.label,
            icon: o.icon,
            shape,
            dataset: { value: val },
            attrs: { role: 'tab' },
            aria: { selected: 'false' },
            onmousedown: () => setActive(val),
            onkeydown: (e) => handleKeydown(e, i, val)
          });
          tabBtns.push(btn);
          return btn;
        })
      }),
      !asButtonGroup && el('div', { 
        class: [
          'ui-tabs__panel', 
          withBorder && ['border', 'padding'],
          hasPadding && `pad-${padding}`
        ],
        ref: (e) => output = e 
      })
    ]
  });

  appendButtons?.append(root.children[0]);
  appendContent?.append(root.children[1]);

  setActive(current, true);
  withValue(root, () => current, setActive);

  return root;
}
