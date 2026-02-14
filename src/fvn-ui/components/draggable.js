import { el, col, parseArgs, bemFactory } from '../dom.js'
import { svg } from './svg.js'
import './draggable.css'

const bem = bemFactory('draggable');

/**
 * Creates a draggable/sortable list with drag handles
 * @param {Object} config
 * @param {Array} [config.items] - Initial items (elements or objects with { content, id })
 * @param {string} [config.icon='menu'] - Drag handle icon name
 * @param {boolean} [config.border=true] - Show border around items
 * @param {string} [config.handlePosition='right'] - Handle position: 'left' or 'right'
 * @param {Function} [config.onChange] - Called after reorder with { items, from, to }
 * @param {Function} [config.onDragStart] - Called when drag starts
 * @param {Function} [config.onDragEnd] - Called when drag ends
 * @param {string} [config.id] - Registers to dom.draggable[id]
 * @returns {HTMLElement} Draggable container with .add(), .remove(), .items, .reorder() methods
 * @example
 * const list = draggable({ 
 *   items: [el('div', { text: 'Item 1' }), el('div', { text: 'Item 2' })],
 *   onChange: ({ items }) => console.log('New order:', items)
 * })
 * list.add(el('div', { text: 'Item 3' }))
 * list.remove(0)
 */
export function draggable(...args) {
  const {
    parent,
    id,
    items: initialItems = [],
    icon = 'menu',
    border = true,
    handlePosition = 'right',
    index = true,
    onChange,
    onDragStart,
    onDragEnd,
    ...rest
  } = parseArgs(...args);

  let containerEl;
  let draggedItem = null;
  let draggedFromIndex = -1;

  const getItems = () => [...containerEl.children].map(w => w._content);

  const createHandle = () => {
    return el('div', {
      class: bem.el('handle'),
      html: svg(icon)
    });
  };

  const createItemWrapper = (item) => {
    const content = item.content || item;
    const handle = createHandle();
    
    const contentWrap = el('div', {
      class: bem.el('content'),
      children: [content]
    });

    const wrapper = el('div', {
      class: [bem.el('item'), index && bem('index'), item.disabled && bem('disabled'), border && 'ui-border'],
      draggable: 'true',
      children: handlePosition === 'left' 
        ? [handle, contentWrap]
        : [contentWrap, handle]
    });

    // Store reference to content
    wrapper._content = content;

    // Drag events
    wrapper.ondragstart = (e) => {
      draggedItem = wrapper;
      draggedFromIndex = [...containerEl.children].indexOf(wrapper);
      wrapper.classList.add('ui-dragging');
      e.dataTransfer.effectAllowed = 'move';

      // Hide the ghost image using an offscreen empty element
      const ghost = document.createElement('div');
      ghost.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      requestAnimationFrame(() => ghost.remove());
      onDragStart?.({ item: content, element: wrapper });
    };

    wrapper.ondragend = () => {
      wrapper.classList.remove('ui-dragging');
      const newIndex = [...containerEl.children].indexOf(wrapper);
      
      // Fire onChange if position changed
      if (draggedFromIndex !== -1 && draggedFromIndex !== newIndex) {
        onChange?.({ 
          items: getItems(), 
          from: draggedFromIndex, 
          to: newIndex 
        });
      }
      
      draggedItem = null;
      draggedFromIndex = -1;
      onDragEnd?.({ item: content, element: wrapper, index: newIndex });
    };

    wrapper.ondragover = (e) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === wrapper) return;
      
      const rect = wrapper.getBoundingClientRect();
      containerEl.insertBefore(
        draggedItem,
        e.clientY > rect.top + rect.height / 2
          ? wrapper.nextElementSibling
          : wrapper
      );
    };

    return wrapper;
  };

  const add = (item, index) => {
    const wrapper = createItemWrapper(item);
    
    if (index !== undefined && index >= 0 && index < containerEl.children.length) {
      containerEl.insertBefore(wrapper, containerEl.children[index]);
    } else {
      containerEl.appendChild(wrapper);
    }
    
    return wrapper;
  };

  const remove = (indexOrElement) => {
    let wrapper;
    
    if (typeof indexOrElement === 'number') {
      wrapper = containerEl.children[indexOrElement];
    } else {
      wrapper = [...containerEl.children].find(w => 
        w._content === indexOrElement || w === indexOrElement
      );
    }

    if (wrapper) {
      const content = wrapper._content;
      wrapper.remove();
      return content;
    }
    return null;
  };

  const clear = () => {
    containerEl.innerHTML = '';
  };

  const reorder = (fromIndex, toIndex) => {
    const children = [...containerEl.children];
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= children.length || toIndex >= children.length) return;

    const item = children[fromIndex];
    const target = children[toIndex];
    
    if (fromIndex < toIndex) {
      containerEl.insertBefore(item, target.nextElementSibling);
    } else {
      containerEl.insertBefore(item, target);
    }

    onChange?.({ 
      items: getItems(), 
      from: fromIndex, 
      to: toIndex 
    });
  };

  // Create container
  const container = col(parent, {
    ...rest,
    id,
    class: [bem(), rest.class],
    ref: (el) => { containerEl = el; }
  });

  // Allow drop on container
  container.ondragover = (e) => e.preventDefault();

  // Initialize with items
  initialItems.forEach(item => add(item));

  // API
  Object.defineProperty(container, 'items', { get: getItems });
  container.add = add;
  container.remove = remove;
  container.clear = clear;
  container.reorder = reorder;

  return container;
}
