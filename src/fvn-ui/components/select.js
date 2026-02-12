import { el, getCallback, escapeHtml, onOutsideClick, withValue, parseArgs, propsToClasses } from '../dom.js'
import { button } from './button.js'
import { svg } from './svg.js'
import './select.css'

/**
 * Creates a custom select dropdown
 * @param {Object} config
 * @param {{value: string|number, label: string, disabled?: boolean}[]} config.options - Select options (alias: items)
 * @param {string|number|(string|number)[]} [config.value] - Initially selected value(s)
 * @param {string} [config.label] - Select label
 * @param {string} [config.placeholder='Select'] - Placeholder text
 * @param {boolean} [config.multiselect=false] - Allow multiple selections
 * @param {boolean} [config.filter] - Show filter input (defaults to true if items > 10)
 * @param {string} [config.filterPlaceholder='Filter...'] - Filter input placeholder
 * @param {Function} [config.onChange] - Called with (value, item, event) or (values[], items[], event) for multiselect
 * @param {string} [config.id] - Registers to dom.select[id] and dom[id]
 * @returns {HTMLDivElement} Select element with .value getter/setter
 * @example
 * selectComponent({ label: 'Country', options: [{ value: 'us', label: 'USA' }] })
 * selectComponent({ placeholder: 'Pick fruit', options: fruits, onChange: handleChange })
 * selectComponent({ label: 'Tags', options: tags, multiselect: true })
 */
export function selectComponent(...args) {
  const {
    parent,
    items: itemsProp,
    options,
    value,
    placeholder = 'Select',
    label,
    adaptive = true,
    multiselect = false,
    filter: filterProp,
    filterPlaceholder = 'Filter...',
    props = {},
    ...rest
  } = parseArgs(...args);

  let items = itemsProp || options || [];
  const showFilter = Number.isInteger(filterProp) ? items.length > filterProp : !!filterProp;
  const cb = getCallback('onChange', rest);

  let selectEl, triggerEl, valueEl, listEl, filterEl, badgeEl, cleanupOutside;
  let isOpen = false;
  let filterText = '';
  
  // Convert index to value if needed
  const toValue = (v) => Number.isInteger(v) && items[v] ? String(items[v].value) : String(v);
  
  // For multiselect, use a Set; for single, use a single value
  let selected = multiselect 
    ? new Set(Array.isArray(value) ? value.map(toValue) : value != null ? [toValue(value)] : [])
    : (value ?? null);
  
  let highlightedIndex = -1;

  const getIndexByValue = (v) => items.findIndex((it) => String(it.value) === String(v));
  const wrapPlaceholder = (s) => `<span class="ui-select__placeholder">${escapeHtml(s)}</span>`;
  
  const getSelectedItems = () => multiselect 
    ? items.filter(it => selected.has(String(it.value)))
    : items[getIndexByValue(selected)];

  const updateBadge = () => {
    if (!multiselect || !badgeEl) return;
    const count = selected.size;
    badgeEl.textContent = count || '';
    badgeEl.hidden = count === 0;
  };

  const renderValue = () => {
    if (multiselect) {
      const count = selected.size;
      if (count === 0) {
        valueEl.innerHTML = wrapPlaceholder(placeholder);
      } else if (count === 1) {
        const item = items.find(it => selected.has(String(it.value)));
        valueEl.innerHTML = escapeHtml(item?.label || placeholder);
      } else {
        // Use placeholder as label when multiple selected (badge shows count)
        valueEl.innerHTML = escapeHtml(placeholder);
      }
      updateBadge();
      return;
    }
    
    const idx = Number.isInteger(selected) ? selected : getIndexByValue(selected);
    if (idx < 0) {
      valueEl.innerHTML = wrapPlaceholder(placeholder);
      return;
    }
    const opt = items[idx];
    valueEl.innerHTML = opt.disabled ? wrapPlaceholder(opt.label) : escapeHtml(opt.label);
  };
  const renderList = () => {
    listEl.innerHTML = '';
    for (const it of items) {
      const isSelected = multiselect 
        ? selected.has(String(it.value))
        : String(it.value) === String(selected);
      const matchesFilter = !filterText || it.label.toLowerCase().includes(filterText);
      
      listEl.appendChild(
        el('button', {
          type: 'button',
          class: 'ui-select__item',
          attrs: { role: 'option', 'aria-selected': isSelected },
          data: { value: it.value },
          disabled: it.disabled,
          hidden: !matchesFilter,
          children: [
            el('span', { text: it.label }),
            isSelected && el('span', { class: 'ui-select__check', html: svg('check') })
          ],
          onClick: (e) => {
            if (it.disabled) return;
            
            if (multiselect) {
              toggleValue(it.value, e);
            } else {
              setValue(it.value, e);
              setOpen(false);
              triggerEl.focus();
            }
          }
        })
      );
    }
  };

  const setOpen = (next) => {
    isOpen = !!next;
    selectEl.dataset.open = isOpen;
    triggerEl.setAttribute('aria-expanded', isOpen);

    if (!isOpen) {
      cleanupOutside?.();
      document.removeEventListener('keydown', onDocKeydown, true);
      filterText = '';
      if (filterEl) filterEl.value = '';
      return;
    }

    renderList();
    highlightedIndex = multiselect ? 0 : Math.max(0, getIndexByValue(selected));
    focusHighlighted();
    
    if (showFilter && filterEl) {
      setTimeout(() => filterEl.focus(), 0);
    } else {
      setTimeout(() => listEl.focus(), 0);
    }
    
    cleanupOutside = onOutsideClick(selectEl, () => setOpen(false));
    document.addEventListener('keydown', onDocKeydown, true);
  };

  const setValue = (v, e) => {
    selected = v;
    renderValue();
    cb?.(selected, getSelectedItems(), e);
  };
  
  const toggleValue = (v, e) => {
    const strVal = String(v);
    if (selected.has(strVal)) {
      selected.delete(strVal);
    } else {
      selected.add(strVal);
    }
    renderValue();
    renderList();
    cb?.([...selected], getSelectedItems(), e);
  };
  
  const clearAll = (e) => {
    e.stopPropagation();
    selected.clear();
    renderValue();
    if (isOpen) renderList();
    cb?.([], [], e);
  };
  
  const onFilter = (e) => {
    filterText = e.target.value.toLowerCase();
    renderList();
  };

  const focusHighlighted = () => {
    const opts = listEl.querySelectorAll('.ui-select__item:not([hidden])');
    if (!opts.length) {
      return;
    }

    let i = Math.max(0, Math.min(highlightedIndex, opts.length - 1));
    let tries = 0;
    while (tries < opts.length && opts[i].disabled) {
      i = (i + 1) % opts.length;
      tries++;
    }
    highlightedIndex = i;
    opts[i]?.focus();
  };

  const moveHighlight = (delta) => {
    const opts = listEl.querySelectorAll('.ui-select__item:not([hidden])');
    if (!opts.length) {
      return;
    }
    highlightedIndex = (Math.max(0, highlightedIndex) + delta + opts.length) % opts.length;
    focusHighlighted();
  };

  const onDocKeydown = (e) => {
    if (!isOpen) {
      return;
    }
    
    const keyActions = {
      Escape: () => { setOpen(false); triggerEl.focus(); },
      ArrowDown: () => moveHighlight(1),
      ArrowUp: () => moveHighlight(-1),
      Enter: () => {
        const btn = listEl.querySelectorAll('.ui-select__item:not([hidden])')[highlightedIndex];
        if (!btn?.disabled) {
          btn.click();
        }
      }
    };

    const action = keyActions[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  const onTriggerKeydown = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
      return;
    }
    e.preventDefault();
    if (!isOpen) {
      setOpen(true);
    }
  };

  const root = el('div', parent, {
    ...rest,
    class: ['flex', 'flex-col', 'gap-2', propsToClasses(props), rest.class],
    children: [
      label && el('div', { class: 'ui-label ui-label--soft', html: label }),
      el('div', {
        class: ['ui-select', multiselect && 'ui-select--multi'],
        data: { open: false },
        ref: (e) => selectEl = e,
        children: [
          el('button', {
            type: 'button',
            class: 'ui-select__trigger ui-border',
            attrs: { 'aria-haspopup': 'listbox', 'aria-expanded': false },
            ref: (e) => triggerEl = e,
            onClick: () => setOpen(!isOpen),
            onKeydown: onTriggerKeydown,
            children: [
              el('span', { class: 'ui-select__value', ref: (e) => valueEl = e }),
              el('span', { class: 'ui-select__actions', children: [
                button({ icon: 'chevronDown', variant: 'stripped', muted: true }),
                multiselect && el('span', { 
                  class: 'ui-select__badge',
                  ref: (e) => badgeEl = e,
                  hidden: true,
                  onClick: clearAll
                })
              ]})
            ]
          }),
          el('div', {
            class: 'ui-select__popover ui-border',
            children: [
              showFilter && el('input', {
                type: 'text',
                class: 'ui-select__filter',
                placeholder: filterPlaceholder,
                ref: (e) => filterEl = e,
                onInput: onFilter,
                onClick: (e) => e.stopPropagation()
              }),
              el('div', {
                class: 'ui-select__list',
                attrs: { role: 'listbox', tabindex: -1 },
                ref: (e) => listEl = e
              })
            ]
          })
        ]
      })
    ]
  });

  renderValue();

  if (!adaptive) {
    return withValue(
      root, 
      () => multiselect ? [...selected] : selected, 
      (v, e) => {
        if (multiselect) {
          selected = new Set(Array.isArray(v) ? v.map(toValue) : v != null ? [toValue(v)] : []);
          renderValue();
          e && cb?.([...selected], getSelectedItems(), e);
        } else {
          setValue(v, e);
        }
      }
    );
  }

  requestAnimationFrame(() => {
    const sizer = valueEl.cloneNode(false);
    Object.assign(sizer.style, { visibility: 'hidden', height: '0', overflow: 'hidden', whiteSpace: 'nowrap' });
    sizer.textContent = items.reduce((a, b) => a.label.length > b.label.length ? a : b, { label: placeholder }).label;
    triggerEl.appendChild(sizer);
    requestAnimationFrame(() => {
      selectEl.style.minWidth = `${selectEl.offsetWidth}px`;
      sizer.remove();
    });
  });

  /**
   * Updates the select component's options/items and optionally value.
   * @param {Object} config
   * @param {{value: string|number, label: string, disabled?: boolean}[]} [config.options] - New options/items
   * @param {string|number|(string|number)[]} [config.value] - New value(s)
   */
  root.update = function({ options: newOptions, items: newItems, value: newValue } = {}) {
    if (newOptions || newItems) {
      items = newItems || newOptions;
    }
    if (typeof newValue !== 'undefined') {
      if (multiselect) {
        selected = new Set(Array.isArray(newValue) ? newValue.map(toValue) : newValue != null ? [toValue(newValue)] : []);
      } else {
        selected = newValue;
      }
    }
    renderValue();
    if (isOpen) renderList();
  };  

  return withValue(
    root, 
    () => multiselect ? [...selected] : selected, 
    (v, e) => {
      if (multiselect) {
        selected = new Set(Array.isArray(v) ? v.map(toValue) : v != null ? [toValue(v)] : []);
        renderValue();
        e && cb?.([...selected], getSelectedItems(), e);
      } else {
        setValue(v, e);
      }
    }
  );
}
