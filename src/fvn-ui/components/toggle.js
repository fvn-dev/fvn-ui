import { el, getCallback, withValue, parseArgs, propsToClasses } from '../dom.js'
import './toggle.css'

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
    checked,
    disabled,
    color = 'default',
    id,
    props = {},
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

  const root = el('nav', parent, {
    ...rest,
    class: ['ui-toggle', propsToClasses(props), rest.class],
    data: { checked: state, uiCol: color },
    disabled,
    id,
    onClick: handleClick,
    children: [
      el('div', { text: options[0] }),
      el('div', { text: options[1] })
    ]
  });

  return withValue(root, () => state, setState);
}
