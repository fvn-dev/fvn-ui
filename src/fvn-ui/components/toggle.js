import { el, col, getCallback, withValue, parseArgs, configToClasses, bemFactory } from '../dom.js'
import { label as textLabel } from './text.js'
import './toggle.css'

const bem = bemFactory('toggle');

/**
 * Creates a semantic toggle with two labeled options
 * @param {Object} config
 * @param {[string, string]} config.options - Two option labels [left, right]
 * @param {boolean} [config.checked] - If true, right option is selected
 * @param {boolean} [config.disabled] - Disabled state
 * @param {'default'|'primary'|'red'|'green'|'blue'|'pink'} [config.color='default'] - Toggle color
 * @param {Function} [config.onChange] - Called with (checked, event)
 * @param {string} [config.id] - Registers to dom.toggle[id] and dom[id]
 * @returns {HTMLElement} Toggle element with .value getter/setter
 * @example
 * toggle({ options: ['Week', 'Day'], onChange: (v) => console.log(v) })
 * toggle({ options: ['Off', 'On'], checked: true, color: 'primary' })
 */
export function toggle(...args) {
  const {
    parent,
    options = ['Off', 'On'],
    variant,
    checked,
    label,
    disabled,
    color = 'default',
    id,
    props,
    ...rest
  } = parseArgs(...args);

  const cb = getCallback('onChange', rest);
  let state = !!checked;

  const setState = (next, e) => {
    state = !!next;
    root.dataset.checked = state;
    e && cb?.(state, e);
  };

  const handleClick = (e) => {
    if (disabled) return;
    setState(!state, e);
  };

  const container = col(parent, [ label && textLabel(label) ], { gap: 2 });
  const root = el('nav', container, {
    ...rest,
    class: [bem(), configToClasses(props), variant && bem(variant), rest.class],
    data: { checked: state, uiCol: color },
    disabled,
    id,
    onClick: handleClick,
    children: [
      el('div', { text: options[0] }),
      el('div', { text: options[1] })
    ]
  });

  return withValue(container, () => state, setState);
}
