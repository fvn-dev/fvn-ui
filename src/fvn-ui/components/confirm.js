import { el, getCallback, parseArgs, configToClasses, bemFactory } from '../dom.js'
import { button } from './button.js'
import { dialog } from './dialog.js'
import { header } from './text.js'

const bem = bemFactory('dialog');

/**
 * Creates a confirmation dialog with trigger button
 * @param {Object} config
 * @param {string} [config.label='Open dialog'] - Trigger button text
 * @param {string} [config.title='Are you absolutely sure?'] - Dialog title
 * @param {string} [config.description='This action cannot be undone.'] - Dialog description
 * @param {string} [config.confirm='Continue'] - Confirm button text
 * @param {string} [config.cancel='Cancel'] - Cancel button text
 * @param {'modal'|'tooltip'} [config.type='modal'] - Dialog type
 * @param {string} [config.icon] - Trigger button icon
 * @param {'round'} [config.shape] - Trigger button shape
 * @param {'primary'|'red'|'green'|'blue'} [config.color] - Color for both trigger and confirm buttons
 * @param {'primary'|'red'|'green'|'blue'} [config.triggerColor] - Override color for trigger button
 * @param {'primary'|'red'|'green'|'blue'} [config.confirmColor] - Override color for confirm button
 * @param {'default'|'primary'|'outline'|'ghost'} [config.variant] - Trigger button variant
 * @param {boolean} [config.inverted] - Inverted dialog style
 * @param {Function} [config.onConfirm] - Called when confirm clicked
 * @param {Function} [config.onCancel] - Called when cancel clicked
 * @returns {HTMLDivElement} Container with trigger button and dialog
 * @example
 * confirm({ label: 'Delete', color: 'red', title: 'Delete item?', onConfirm: handleDelete })
 * confirm({ label: 'Save', triggerColor: 'green', confirmColor: 'red', title: 'Confirm?' })
 */
export function confirm(...args) {
  const {
    parent,
    icon,
    shape,
    color,
    triggerColor,
    confirmColor,
    variant,
    label = 'Open dialog',
    title = 'Are you absolutely sure?',
    description = 'This action cannot be undone.',
    confirm = 'Continue',
    cancel = 'Cancel',
    dialogVariant,
    type, // backward compat alias for dialogVariant
    inverted,
    props,
    ...rest
  } = parseArgs(...args);

  const cbCancel = getCallback('onCancel', rest);
  const cbConfirm = getCallback('onConfirm', rest);
  const dlgVariant = dialogVariant || type || 'modal';

  const root = el('div', parent, { ...rest, class: [configToClasses(props), rest.class] });

  const trigger = button(root, {
    label,
    variant,
    color: triggerColor || color,  
    icon,
    shape
  });

  const instance = dialog(root, {
    variant: dlgVariant,
    anchor: trigger,
    inverted,
    content: (close) => [
      header({ title, description, class: bem.el('inner') }),
      el('div', {
        class: bem.el('footer'),
        children: [
          button({
            label: cancel,
            shape,
            variant: 'ghost',
            onclick: () => {
              cbCancel?.();
              close();
            }
          }),
          button({
            label: confirm,
            color: confirmColor || color,
            shape,
            onclick: async function() {
              try {
                this.disabled = true;
                await cbConfirm?.(true);
                close();
              } finally {
                this.disabled = false;
              }
            }
          })
        ]
      })
    ]
  });

  trigger.addEventListener('click', () => instance.showDialog());

  root.open = () => instance.showDialog();
  root.close = () => instance.hideDialog();

  return root;
}