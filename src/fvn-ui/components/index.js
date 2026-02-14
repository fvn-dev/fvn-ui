import { dom } from '../dom.js'

import { confirm as _confirm } from './confirm.js'
import { avatar as _avatar } from './avatar.js'
import { button as _button } from './button.js'
import { card as _card } from './card.js'
import { collapsible as _collapsible } from './collapsible.js'
import { editable as _editable } from './editable.js'
import { dashboard as _dashboard } from './dashboard.js'
import { dialog as _dialog } from './dialog.js'
import { draggable as _draggable } from './draggable.js'
import { image as _image } from './image.js'
import { input as _input } from './input.js'
import { checkbox as _checkbox } from './checkbox.js'
import { radio as _radio } from './radio.js'
import { selectComponent as _selectComponent } from './select.js'
import { svg as _svg } from './svg.js'
import { switchComponent as _switchComponent } from './switch.js'
import { tabs as _tabs } from './tabs.js'
import { toggle as _toggle } from './toggle.js'
import { text, divider, title, description, header, label } from './text.js'

const BASE_CLASS = 'ui-component';

const slugify = (str) => String(str || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const bootstrap = (componentFn, componentName, customConfig) => (...args) => {
  const idx = args.findIndex((a) => a && typeof a === 'object' && !(a instanceof Node) && !Array.isArray(a));
  const obj = idx !== -1 ? args[idx] : (args.push({}), args.at(-1));
  obj.class = [BASE_CLASS, obj.class];
  
  if (customConfig) {
    Object.assign(obj, customConfig);
  }
  
  const result = componentFn(...args);
  
  // ---> register in dom object if identifiable

  const key = obj.id || slugify(obj.label) || slugify(obj.title);
  if (key && componentName) {
    (dom[componentName] ||= {})[key] = result;
    if (obj.id) {
      dom[obj.id] = result;
    }
  }
  
  return result;
};

export const avatar = bootstrap(_avatar, 'avatar');
export const button = bootstrap(_button, 'button');
export const card = bootstrap(_card, 'card');
export const collapsible = bootstrap(_collapsible, 'collapsible');
export const confirm = bootstrap(_confirm, 'confirm');
export const editable = bootstrap(_editable, 'editable');
export const dashboard = bootstrap(_dashboard, 'dashboard');
export const dialog = bootstrap(_dialog, 'dialog');
export const draggable = bootstrap(_draggable, 'draggable');
export const image = bootstrap(_image, 'image');
export const input = bootstrap(_input, 'input');
export const modal = bootstrap(_dialog, 'modal', { type: 'modal' });
export const checkbox = bootstrap(_checkbox, 'checkbox');
export const radio = bootstrap(_radio, 'radio');
export const selectComponent = bootstrap(_selectComponent, 'select');
export const switchComponent = bootstrap(_switchComponent, 'switch');
export const svg = bootstrap(_svg, 'svg');
export const tabs = bootstrap(_tabs, 'tabs');
export const textarea = bootstrap(_input, 'textarea', { rows: 4 });
export const toggle = bootstrap(_toggle, 'toggle');

/**
 * Creates a toggle group (tabs without content panel, for selection UI)
 * @param {Object} config
 * @param {Array<{label: string, icon?: string, color?: string}>} config.items - Toggle items
 * @param {number} [config.active=0] - Initially active index
 * @param {Function} [config.callback] - Called with active index on change
 * @param {'default'|'outline'|'ghost'|'minimal'|'border'} [config.variant='default'] - Style variant
 * @param {'round'} [config.shape] - Round shape
 * @param {boolean} [config.shade] - Shaded background
 * @param {string} [config.color] - Color theme
 * @param {string} [config.width] - Width ('auto' or CSS value)
 * @returns {HTMLElement} Toggle group element
 * @example
 * toggleGroup({
 *   items: [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }],
 *   active: 0,
 *   callback: (index) => console.log('Selected:', index)
 * })
 */
export const toggleGroup = bootstrap(_tabs, 'toggleGroup', { asButtonGroup: true });
export const tooltip = bootstrap(_dialog, 'tooltip', { type: 'tooltip' });

// Text primitives (no bootstrap needed)
export { text, divider, title, description, header, label };
