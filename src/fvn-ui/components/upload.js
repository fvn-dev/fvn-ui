import { el, col, row, parseArgs, configToClasses, getCallback, bemFactory } from '../dom.js'
import { button } from './button.js'
import { svg } from './svg.js'
import { label as textLabel, title, description } from './text.js'
import { createValidationController } from './validation.js'
import './upload.css'

const bem = bemFactory('upload');

const text = 'text/*,.txt,.text,.md,.markdown,.csv,.tsv,.json,.jsonl,.xml,.yml,.yaml,.toml,.ini,.cfg,.conf,.log,.html,.htm,.pdf,.rtf,.doc,.docx,.odt,.pages';
const audio = 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac';
const video = 'video/*,.mp4,.mov,.webm,.avi,.mkv,.mpeg';
const image = 'image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tif,.tiff,.svg,.heic';

const ACCEPT_BY_TYPE = {
  text,
  audio,
  video,
  image,
  any: [text, audio, video, image].join(',')
};

const normalizeType = (type) => (
  type === 'image' || type === 'text' || type === 'audio' || type === 'video' ? type : 'any'
);

const getExt = (name = '') => {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase();
};

const BLOCKED_EXTENSIONS = new Set([
  'app', 'appimage', 'apk', 'bat', 'bin', 'chm', 'cmd', 'com', 'cpl', 'crt',
  'dll', 'dmg', 'exe', 'gadget', 'hta', 'inf', 'iso', 'jar', 'jnlp', 'js',
  'jse', 'ksh', 'lnk', 'msc', 'msi', 'msp', 'mst', 'pif', 'pkg', 'ps1', 'ps1xml',
  'ps2', 'ps2xml', 'psc1', 'psc2', 'psd1', 'psm1', 'py', 'rb', 'reg', 'rpm',
  'scr', 'scf', 'sh', 'sys', 'vb', 'vbe', 'vbs', 'ws', 'wsc', 'wsf', 'wsh',
  'xlam', 'xlsb', 'xlsm', 'xltm', 'docm', 'dotm', 'pptm', 'ppam', 'ppsm', 'potm'
]);

const BLOCKED_MIME_PREFIXES = [
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-dosexec',
  'application/x-msi',
  'application/x-ms-installer',
  'application/x-sh',
  'application/x-bat',
  'application/x-powershell',
  'application/x-executable',
  'application/x-mach-binary',
  'application/x-elf',
  'application/vnd.microsoft.portable-executable',
  'application/java-archive',
  'text/x-script'
];

const TEXT_DOC_EXTENSIONS = new Set([
  'txt', 'text', 'md', 'markdown', 'rst', 'asc', 'log', 'csv', 'tsv',
  'json', 'jsonl', 'xml', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf',
  'html', 'htm', 'xhtml', 'sql', 'tex',
  'pdf', 'rtf', 'doc', 'docx', 'odt', 'pages'
]);

const TEXT_DOC_MIME_TYPES = new Set([
  'application/pdf',
  'application/rtf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/xhtml+xml',
  'application/xml',
  'application/json',
  'application/x-yaml',
  'application/yaml',
  'text/rtf',
  'text/yaml',
  'text/x-yaml'
]);

const SAFE_ANY_EXTENSIONS = new Set([
  ...TEXT_DOC_EXTENSIONS,
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff', 'svg', 'heic',
  'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac',
  'mp4', 'mov', 'webm', 'avi', 'mkv', 'mpeg'
]);

const SAFE_ANY_MIME_TYPES = new Set([
  ...TEXT_DOC_MIME_TYPES,
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/flac',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'video/x-matroska'
]);

const isImageFile = (file) => file?.type?.startsWith('image/');
const isAudioFile = (file) => file?.type?.startsWith('audio/');
const isVideoFile = (file) => file?.type?.startsWith('video/');

const isTextDocumentFile = (file) => {
  const ext = getExt(file?.name);
  const type = (file?.type || '').toLowerCase();
  if (type.startsWith('text/')) return true;
  if (TEXT_DOC_MIME_TYPES.has(type)) return true;
  return TEXT_DOC_EXTENSIONS.has(ext);
};

const isBlockedFile = (file) => {
  const ext = getExt(file?.name);
  const type = (file?.type || '').toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) return true;
  return BLOCKED_MIME_PREFIXES.some((blocked) => type.startsWith(blocked));
};

const isSafeAnyFile = (file) => {
  if (!file) return false;
  const ext = getExt(file.name);
  const type = (file.type || '').toLowerCase();
  if (isImageFile(file)) return true;
  if (type.startsWith('audio/') || type.startsWith('video/') || type.startsWith('text/')) return true;
  if (SAFE_ANY_MIME_TYPES.has(type)) return true;
  return SAFE_ANY_EXTENSIONS.has(ext);
};

const iconMap = {
  image: 'image',
  audio: 'audio',
  video: 'video',
  text: 'file-text',
  any: 'file' 
};

const iconForType = (type) => {
  return iconMap[type] || iconMap.any;
}

const iconForFile = (file) => {
  const type = isImageFile(file) 
    ? 'image' 
    : isAudioFile(file)
      ? 'audio'
      : isVideoFile(file)
        ? 'video'
        : isTextDocumentFile(file) 
          ? 'text' 
          : 'any';
  return iconForType(type);
};

const setPreviewIcon = (previewIconEl, icon) => {
  if (!previewIconEl) return;
  previewIconEl.innerHTML = svg(icon);
};

const isAllowedByType = (file, type) => {
  if (!file || isBlockedFile(file)) return false;
  if (type === 'image') return isImageFile(file);
  if (type === 'text') return isTextDocumentFile(file);
  if (type === 'audio') return isAudioFile(file);
  if (type === 'video') return isVideoFile(file);
  return isSafeAnyFile(file);
};

const toFormData = (file, extra = {}) => {
  const form = new FormData();
  form.append('file', file, file.name);
  Object.entries(extra).forEach(([key, val]) => {
    if (val != null) form.append(key, String(val));
  });
  return form;
};

const createUploadPayload = (file) => {
  const ext = getExt(file.name);
  const mimetype = file.type || 'application/octet-stream';
  return {
    file,
    filename: file.name,
    mimetype,
    size: file.size,
    lastModified: file.lastModified,
    ext,
    formData: toFormData(file),
    toFormData: (extra) => toFormData(file, extra),
    arrayBuffer: () => file.arrayBuffer(),
    text: () => file.text(),
  };
};

/**
 * Creates a file upload with drag/drop + picker button.
 * @param {Object} config
 * @param {'any'|'image'|'text'|'audio'|'video'} [config.type='any'] - File type filter
 * @param {string} [config.label] - Label text
 * @param {string} [config.placeholder='Drop file here'] - Main dropzone text
 * @param {string} [config.hint] - Helper text under placeholder
 * @param {string} [config.button='Choose file'] - Picker button label
 * @param {string} [config.accept] - Custom accept attribute (overrides type)
 * @param {boolean} [config.required=false] - Require a selected file
 * @param {string|Object} [config.message] - Validation message(s), supports { required }
 * @param {Function} [config.onUpload] - Callback with (payload, file, event)
 * @param {Function} [config.onChange] - Alias callback with (payload, file, event)
 * @param {boolean} [config.disabled] - Disable interactions
 * @param {string} [config.id] - Registers to dom.upload[id] and dom[id]
 * @returns {HTMLDivElement} Upload wrapper with .value/.file, .open(), .clear()
 * @example
 * upload({ type: 'image', onUpload: ({ slack }) => send(slack) })
 * upload({ label: 'Attachment', type: 'text' })
 */
export function upload(...args) {
  const {
    parent,
    id,
    label,
    type = 'any',
    placeholder = 'Drop file here',
    hint = 'Drag and drop, or choose a file',
    button: buttonLabel = 'Choose file',
    accept,
    required = false,
    message,
    disabled = false,
    attrs = {},
    props,
    ...rest
  } = parseArgs(...args);

  const callback = getCallback('onUpload', rest, true) || getCallback('onChange', rest);
  const normalizedType = normalizeType(type);
  const acceptValue = accept || ACCEPT_BY_TYPE[normalizedType];

  let rootEl, dropEl, inputEl, fileNameEl, previewIconEl;
  let badgeElement = button({ label: 'ext', badge: true, hidden: true, color: 'yellow' });
  let currentPayload = null;

  const validation = createValidationController({
    required,
    message,
    checkLength: false,
    getValue: () => (currentPayload ? '1' : ''),
    setInvalid: (isInvalid) => dropEl?.classList.toggle('invalid', isInvalid),
    setMessage: (text, visible) => {
      if (text) {
        fileNameEl.textContent = text;
        // visible = error
      }
    }
  });

  const setFile = (file, event) => {
    if (!file) return;
    validation.clearManualError();

    if (file && isBlockedFile(file)) {
      validation.error('This file type is blocked for security reasons.');
      return;
    }

    if (!isAllowedByType(file, normalizedType)) {
      const targetLabel = normalizedType === 'any' ? 'supported file' : `${normalizedType} file`;
      validation.error(`Please choose a valid ${targetLabel}.`);
      return;
    }

    validation.ok();
    currentPayload = createUploadPayload(file);
    if (fileNameEl) {
      badgeElement.setLabel(getExt(file.name));
      badgeElement.hidden = false;
      fileNameEl.textContent = file.name;
    }
    if (rootEl) rootEl.dataset.hasValue = 'true';
    setPreviewIcon(previewIconEl, iconForFile(file));

    callback?.call(rootEl, currentPayload, file, event);
  };

  const clear = () => {
    currentPayload = null;
    if (inputEl) inputEl.value = '';
    if (fileNameEl) fileNameEl.textContent = hint;
    if (rootEl) rootEl.dataset.hasValue = 'false';
    if (dropEl) dropEl.classList.remove('drag-over');
    setPreviewIcon(previewIconEl, iconForType(normalizedType));
    validation.reset();
  };

  const open = () => {
    if (disabled) return;
    inputEl?.click();
  };

  const onInputChange = (e) => {
    validation.clearManualError();
    setFile(e.target.files?.[0], e);
  };

  const onDragOver = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dropEl.classList.add('drag-over');
  };

  const onDragLeave = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dropEl.classList.remove('drag-over');
  };

  const onDrop = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    dropEl.classList.remove('drag-over');
    validation.clearManualError();
    setFile(e.dataTransfer?.files?.[0], e);
  };

  const onDropZoneKeydown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  const onDropZoneClick = (e) => {
    if (disabled) return;
    if (e.target.closest('button')) return;
    open();
  };
  const root = col(parent, {
    ...rest,
    ...attrs,
    id,
    class: [bem(), configToClasses(props), disabled && bem('disabled'), rest.class],
    ref: (e) => rootEl = e,
    children: [
      label && textLabel({ text: label, soft: true }),
      el('div', {
        class: bem.el('drop'),
        tabindex: disabled ? -1 : 0,
        role: 'button',
        aria: {
          disabled: String(disabled),
          label: label || placeholder
        },
        ref: (e) => dropEl = e,
        data: { hasPreview: 'false' },
        onDragover: onDragOver,
        onDragenter: onDragOver,
        onDragleave: onDragLeave,
        onDrop,
        onClick: onDropZoneClick,
        onKeydown: onDropZoneKeydown,
        children: [
          el('div', {
            class: bem.el('preview'),
            children: [
              el('div', {
                class: bem.el('preview-icon'),
                ref: (e) => previewIconEl = e
              })
            ]
          }),
          col({
            class: bem.el('content'),
            children: [
              title(placeholder, { small: true, children: [ badgeElement ] }),
              description(hint, { 
                small: true,
                muted: true,
                ref: (e) => fileNameEl = e
              }),
              /*
              el('div', { class: bem.el('placeholder'), text: placeholder }),
              el('div', { 
                class: bem.el('hint'), 
                text: hint,
                ref: (e) => fileNameEl = e
              }),
              el('div', {
                class: bem.el('error'),
                hidden: true,
                ref: (e) => errorEl = e
              })
              */
            ]
          }),
          row({ class: bem.el('actions') }, [
            button({
              label: buttonLabel,
              variant: 'outline',
              end: true,
              onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                open();
              }
            })
          ]),
          el('input', {
            class: bem.el('input'),
            type: 'file',
            accept: acceptValue,
            disabled,
            ref: (e) => inputEl = e,
            onChange: onInputChange
          })
        ]
      })
    ]
  });

  clear();

  Object.defineProperty(root, 'value', {
    get: () => currentPayload,
    set: (v) => {
      if (v instanceof File) {
        setFile(v);
        return;
      }
      if (v?.file instanceof File) {
        setFile(v.file);
        return;
      }
      clear();
    }
  });

  Object.defineProperty(root, 'file', {
    get: () => currentPayload?.file || null
  });

  root.open = open;
  root.clear = clear;
  root.input = inputEl;
  root.isValid = validation.check;
  root.error = validation.error;
  root.ok = validation.ok;
  return root;
}
