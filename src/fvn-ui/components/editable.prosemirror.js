import { row, col } from '../dom.js'
import { button } from './button.js'
import { dialog } from './dialog.js'
import { input } from './input.js'
import { toggle } from './toggle.js'
import { EditorState, TextSelection } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Schema, DOMParser as PMDOMParser, DOMSerializer } from 'prosemirror-model'
import { baseKeymap, toggleMark, setBlockType, wrapIn, lift } from 'prosemirror-commands'
import { keymap } from 'prosemirror-keymap'
import { history, undo, redo } from 'prosemirror-history'
import { inputRules, wrappingInputRule, textblockTypeInputRule } from 'prosemirror-inputrules'
import { wrapInList, liftListItem, splitListItem } from 'prosemirror-schema-list'
import { MarkdownParser, MarkdownSerializer, defaultMarkdownParser, defaultMarkdownSerializer, schema as markdownSchema } from 'prosemirror-markdown'

const AVAILABLE_ACTIONS = ['heading', 'bold', 'italic', 'underline', 'strikethrough', 'quote', 'list', 'link', 'markdown', 'clear']
const SUPPORTED_ACTIONS = new Set(['heading', 'bold', 'italic', 'quote', 'list', 'link', 'markdown', 'clear'])
const SKIP_VALIDATION_EVENT_PROP = '__fvnSkipValidation'
const USER_INTERACTION_EVENT_PROP = '__fvnUserInteraction'
const RICH_ADAPTER_INSTANCE_PROP = '__fvnProseMirrorAdapter'
const paragraphSpec = markdownSchema.spec.nodes.get('paragraph')
const schema = new Schema({
  nodes: markdownSchema.spec.nodes.update('paragraph', {
    ...paragraphSpec,
    parseDOM: [
      { tag: 'span[data-ui-paragraph]' }
    ],
    toDOM: () => ['span', { 'data-ui-paragraph': '' }, 0]
  }),
  marks: markdownSchema.spec.marks
})
const domParser = PMDOMParser.fromSchema(schema)
const domSerializer = DOMSerializer.fromSchema(schema)
const markdownParser = new MarkdownParser(schema, defaultMarkdownParser.tokenizer, defaultMarkdownParser.tokens)
const markdownSerializer = new MarkdownSerializer(defaultMarkdownSerializer.nodes, defaultMarkdownSerializer.marks)

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const textToHtml = (text = '') => {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n')
  return lines.map((line) => `<span data-ui-paragraph>${line ? escapeHtml(line) : '<br>'}</span>`).join('')
}

const emptyDoc = () => schema.topNodeType.createAndFill() || schema.node('doc', null, [schema.node('paragraph')])

const normalizeHeadingsToH3 = (node) => {
  if (node.isText) return node
  const children = []
  node.forEach((child) => {
    children.push(normalizeHeadingsToH3(child))
  })
  const attrs = node.type === schema.nodes.heading
    ? { ...node.attrs, level: 3 }
    : node.attrs
  return node.type.create(attrs, children, node.marks)
}

const htmlToDoc = (html = '') => {
  const host = document.createElement('div')
  host.innerHTML = String(html || '')
  return normalizeHeadingsToH3(domParser.parse(host))
}

const markdownToDoc = (markdown = '') => {
  try {
    return normalizeHeadingsToH3(markdownParser.parse(String(markdown || '')))
  } catch {
    return emptyDoc()
  }
}

const docToHtml = (doc) => {
  const host = document.createElement('div')
  host.appendChild(domSerializer.serializeFragment(doc.content))
  return host.innerHTML
}

const docToMarkdown = (doc) => markdownSerializer.serialize(doc)

const normalizeUrl = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
}

const resolveActions = (richInclude, richExclude) => {
  let next = Array.isArray(richInclude)
    ? AVAILABLE_ACTIONS.filter((name) => richInclude.includes(name))
    : [...AVAILABLE_ACTIONS]

  if (Array.isArray(richExclude)) {
    next = next.filter((name) => !richExclude.includes(name))
  }

  return new Set(next)
}

const createInputEvent = ({ skipValidation = false, userInteraction = false } = {}) => {
  const event = new Event('input', { bubbles: true })
  if (skipValidation) {
    event[SKIP_VALIDATION_EVENT_PROP] = true
  }
  if (userInteraction) {
    event[USER_INTERACTION_EVENT_PROP] = true
  }
  return event
}

const markActive = (state, markType) => {
  if (!markType) return false
  const { from, to, empty, $from } = state.selection
  if (empty) return !!markType.isInSet(state.storedMarks || $from.marks())
  return state.doc.rangeHasMark(from, to, markType)
}

const ancestorActive = (state, nodeType, predicate = () => true) => {
  if (!nodeType) return false

  const check = (resolvedPos) => {
    for (let depth = resolvedPos.depth; depth >= 0; depth -= 1) {
      const node = resolvedPos.node(depth)
      if (node.type === nodeType && predicate(node)) {
        return true
      }
    }
    return false
  }

  return check(state.selection.$from) || check(state.selection.$to)
}

const clampPos = (doc, pos) => Math.max(0, Math.min(pos, doc.content.size))

const getLinkRangeAtSelection = (state, markType) => {
  const { empty, from, to, $from } = state.selection
  if (!empty) {
    return { from, to }
  }

  const parent = $from.parent
  let index = $from.index()

  if (index === parent.childCount || !markType.isInSet(parent.child(index).marks)) {
    index -= 1
  }

  if (index < 0 || !markType.isInSet(parent.child(index).marks)) {
    return null
  }

  let start = $from.start()
  for (let i = 0; i < index; i += 1) {
    start += parent.child(i).nodeSize
  }

  let end = start + parent.child(index).nodeSize
  let cursor = index - 1
  while (cursor >= 0 && markType.isInSet(parent.child(cursor).marks)) {
    start -= parent.child(cursor).nodeSize
    cursor -= 1
  }

  cursor = index + 1
  while (cursor < parent.childCount && markType.isInSet(parent.child(cursor).marks)) {
    end += parent.child(cursor).nodeSize
    cursor += 1
  }

  return { from: start, to: end }
}

const getActiveLinkHref = (state) => {
  const linkType = schema.marks.link
  if (!linkType) return ''

  const range = getLinkRangeAtSelection(state, linkType)
  if (!range) {
    const mark = (state.storedMarks || state.selection.$from.marks()).find((item) => item.type === linkType)
    return mark?.attrs?.href || ''
  }

  let href = ''
  state.doc.nodesBetween(range.from, range.to, (node) => {
    if (!node.isText) return
    const linkMark = node.marks.find((item) => item.type === linkType)
    if (linkMark?.attrs?.href) {
      href = linkMark.attrs.href
      return false
    }
  })

  return href
}

const isDocEmpty = (doc) => (
  doc.childCount === 1
  && doc.firstChild?.type === schema.nodes.paragraph
  && doc.firstChild.content.size === 0
)

const createInputRulesPlugin = () => {
  const rules = []

  if (schema.nodes.heading) {
    rules.push(textblockTypeInputRule(/^#{1,6}\s$/, schema.nodes.heading, () => ({ level: 3 })))
  }

  if (schema.nodes.blockquote) {
    rules.push(wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote))
  }

  if (schema.nodes.ordered_list) {
    rules.push(wrappingInputRule(/^(\d+)\.\s$/, schema.nodes.ordered_list, (match) => ({ order: Number(match[1]) })))
  }

  if (schema.nodes.bullet_list) {
    rules.push(wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list))
  }

  return inputRules({ rules })
}

const createPlugins = () => {
  const bindings = {
    'Mod-z': undo,
    'Shift-Mod-z': redo,
    'Mod-y': redo
  }

  if (schema.marks.strong) bindings['Mod-b'] = toggleMark(schema.marks.strong)
  if (schema.marks.em) bindings['Mod-i'] = toggleMark(schema.marks.em)
  if (schema.nodes.list_item) bindings.Enter = splitListItem(schema.nodes.list_item)

  return [
    history(),
    createInputRulesPlugin(),
    keymap(bindings),
    keymap(baseKeymap)
  ]
}

const createState = (doc, plugins) => EditorState.create({
  schema,
  doc,
  plugins
})

const linkTip = (icon) => icon.charAt(0).toUpperCase() + icon.slice(1).replace('-', ' ')

export function createProseMirrorAdapter({
  root,
  editableEl,
  placeholder,
  minRows,
  richInclude,
  richExclude,
  plainText,
  validationConfig = {},
  bem,
  onHtmlInput,
  onFocus,
  onBlur,
  onKeydown,
  onReady
}) {
  const existingAdapter = editableEl?.[RICH_ADAPTER_INSTANCE_PROP]
  const preservedHtml = existingAdapter?.getHTML?.()
  if (existingAdapter?.destroy) {
    existingAdapter.destroy()
    if (preservedHtml != null) {
      editableEl.innerHTML = preservedHtml
    }
  }

  const actions = resolveActions(richInclude, richExclude)
  const plugins = createPlugins()
  let ready = false

  let markdownMode = false
  let markdownSourceHtml = null
  let markdownSourceValue = null
  let markdownSnapshotState = null
  let markdownCacheValue = null
  let markdownCacheDoc = null
  let htmlOverride = null
  let savedSelection = null

  let linkTooltip
  let linkInput

  const toolbar = row({ gap: 1, align: 'center', class: bem.el('toolbar') })
  toolbar.setAttribute('role', 'toolbar')
  root.insertBefore(toolbar, editableEl)

  let currentMin = validationConfig.min
  let currentMax = validationConfig.max

  const markdownField = input({
    rows: Math.max(minRows || 6, 4),
    placeholder,
    required: validationConfig.required,
    validate: validationConfig.validate,
    message: validationConfig.message,
    min: currentMin,
    max: currentMax,
    class: bem.el('markdown-field'),
    onInput: (_value, event) => {
      markdownCacheValue = null
      markdownCacheDoc = null
      onHtmlInput?.(getHTML(), markdownInput, event)
    },
    onFocus: (event) => onFocus?.(markdownInput, event),
    onBlur: (event) => onBlur?.(markdownInput, event),
    onKeydown: (event) => onKeydown?.(markdownInput, event)
  })
  const markdownInput = markdownField.input
  markdownInput.classList.add(bem.el('markdown-input'))
  markdownField.hidden = true
  root.insertBefore(markdownField, editableEl.nextSibling)

  editableEl.setAttribute('role', 'textbox')
  editableEl.setAttribute('aria-multiline', 'true')
  editableEl.setAttribute('contenteditable', 'false')

  const syncEmptyState = () => {
    editableEl.dataset.empty = isDocEmpty(view.state.doc) ? 'true' : 'false'
  }

  const getMarkdownDoc = () => {
    const value = String(markdownInput.value || '')
    if (markdownCacheDoc && markdownCacheValue === value) {
      return markdownCacheDoc
    }
    markdownCacheValue = value
    markdownCacheDoc = markdownToDoc(value)
    return markdownCacheDoc
  }

  const getHTML = () => {
    if (markdownMode) {
      return docToHtml(getMarkdownDoc())
    }
    return htmlOverride ?? docToHtml(view.state.doc)
  }

  const toMarkdown = () => markdownMode
    ? String(markdownInput.value || '')
    : docToMarkdown(view.state.doc)

  const setLimits = ({ min: nextMin, max: nextMax } = {}) => {
    if (nextMin !== undefined) currentMin = nextMin
    if (nextMax !== undefined) currentMax = nextMax
    markdownField.setLimits({ min: nextMin, max: nextMax })
  }

  const setEditorDoc = (doc) => {
    view.updateState(createState(doc, plugins))
    syncEmptyState()
    updateToolbarState()
  }

  const focusRichEditor = () => {
    const focusNow = () => {
      view.focus()
      if (document.activeElement !== view.dom) {
        view.dom.focus({ preventScroll: true })
      }
    }

    requestAnimationFrame(() => {
      focusNow()
      requestAnimationFrame(focusNow)
    })
  }

  const emitInput = (event, target = editableEl) => {
    onHtmlInput?.(getHTML(), target, event || createInputEvent({ skipValidation: true }))
  }

  const captureSelection = () => {
    if (!view || markdownMode) return
    const { from, to } = view.state.selection
    savedSelection = { from, to }
  }

  const restoreSelection = () => {
    if (!savedSelection || markdownMode || !view) return
    const nextFrom = clampPos(view.state.doc, savedSelection.from)
    const nextTo = clampPos(view.state.doc, savedSelection.to)
    const selection = TextSelection.create(view.state.doc, Math.min(nextFrom, nextTo), Math.max(nextFrom, nextTo))
    view.dispatch(view.state.tr.setSelection(selection))
  }

  const dispatchTransaction = (tr) => {
    const nextState = view.state.apply(tr)
    view.updateState(nextState)
    syncEmptyState()

    if (tr.docChanged) {
      htmlOverride = null
      const event = tr.getMeta('fvnEvent')
        || (view.hasFocus()
          ? createInputEvent({ userInteraction: true })
          : createInputEvent({ skipValidation: true }))
      emitInput(event, editableEl)
    }

    updateToolbarState()
  }

  const runCommand = (command, event) => {
    if (!view || markdownMode || typeof command !== 'function') {
      return false
    }
    restoreSelection()
    view.focus()

    return command(view.state, (tr) => {
      const nextTr = event ? tr.setMeta('fvnEvent', event) : tr
      view.dispatch(nextTr.scrollIntoView())
    }, view)
  }

  const toggleHeading = () => {
    const headingType = schema.nodes.heading
    const paragraphType = schema.nodes.paragraph
    if (!headingType || !paragraphType) return

    const command = ancestorActive(view.state, headingType, (node) => node.attrs.level === 3)
      ? setBlockType(paragraphType)
      : setBlockType(headingType, { level: 3 })

    runCommand(command, createInputEvent({ userInteraction: true }))
  }

  const toggleQuote = () => {
    const quoteType = schema.nodes.blockquote
    if (!quoteType) return

    const command = ancestorActive(view.state, quoteType)
      ? lift
      : wrapIn(quoteType)

    runCommand(command, createInputEvent({ userInteraction: true }))
  }

  const toggleList = (listType) => {
    const itemType = schema.nodes.list_item
    if (!listType || !itemType) return

    const command = ancestorActive(view.state, listType)
      ? liftListItem(itemType)
      : wrapInList(listType)

    runCommand(command, createInputEvent({ userInteraction: true }))
  }

  const applyLink = (href) => {
    const linkType = schema.marks.link
    if (!linkType || markdownMode || !view) return false

    restoreSelection()
    view.focus()

    const { state } = view
    const attrs = { href, title: null }
    const selection = state.selection
    let tr = state.tr

    if (selection.empty) {
      const from = selection.from
      const textNode = state.schema.text(href, [linkType.create(attrs)])
      tr = tr.insert(from, textNode)
      tr = tr.setSelection(TextSelection.create(tr.doc, from, from + href.length))
    } else {
      tr = tr.addMark(selection.from, selection.to, linkType.create(attrs))
    }

    tr = tr.setMeta('fvnEvent', createInputEvent({ userInteraction: true }))
    view.dispatch(tr.scrollIntoView())
    return true
  }

  const removeLink = () => {
    const linkType = schema.marks.link
    if (!linkType || markdownMode || !view) return false

    const range = getLinkRangeAtSelection(view.state, linkType)
    if (!range) return false

    const tr = view.state.tr
      .removeMark(range.from, range.to, linkType)
      .setMeta('fvnEvent', createInputEvent({ userInteraction: true }))

    view.dispatch(tr.scrollIntoView())
    return true
  }

  const clearFormatting = () => {
    if (!view || markdownMode) return

    const { state } = view
    const { from, to, empty, $from } = state.selection
    let tr = state.tr.removeMark(from, to)

    if (empty) {
      if (schema.marks.strong) tr = tr.removeStoredMark(schema.marks.strong)
      if (schema.marks.em) tr = tr.removeStoredMark(schema.marks.em)
      if (schema.marks.link) tr = tr.removeStoredMark(schema.marks.link)
      if (schema.marks.code) tr = tr.removeStoredMark(schema.marks.code)
    }

    if (tr.docChanged || tr.storedMarksSet) {
      tr = tr.setMeta('fvnEvent', createInputEvent({ userInteraction: true }))
      view.dispatch(tr)
    }

    const parentType = $from.parent.type
    if (parentType === schema.nodes.heading && schema.nodes.paragraph) {
      runCommand(setBlockType(schema.nodes.paragraph), createInputEvent({ userInteraction: true }))
    }

    if (ancestorActive(view.state, schema.nodes.blockquote)) {
      runCommand(lift, createInputEvent({ userInteraction: true }))
    }
  }

  const toggleMarkdownMode = (force) => {
    const nextMode = typeof force === 'boolean' ? force : !markdownMode
    if (nextMode === markdownMode) {
      return markdownMode
    }

    if (nextMode) {
      markdownSourceHtml = getHTML()
      markdownSourceValue = docToMarkdown(view.state.doc)
      markdownSnapshotState = view.state
      markdownInput.value = markdownSourceValue
      markdownCacheValue = markdownSourceValue
      markdownCacheDoc = view.state.doc

      markdownMode = true
      editableEl.hidden = true
      editableEl.classList.add(bem('markdown'))
      markdownField.hidden = false
      updateToolbarState()

      emitInput(createInputEvent({ skipValidation: true }), markdownInput)
      return markdownMode
    }

    const nextMarkdown = String(markdownInput.value || '')
    markdownMode = false
    editableEl.hidden = false
    editableEl.classList.remove(bem('markdown'))
    markdownField.hidden = true

    if (markdownSnapshotState && nextMarkdown === (markdownSourceValue || '')) {
      view.updateState(markdownSnapshotState)
      htmlOverride = markdownSourceHtml
      syncEmptyState()
      updateToolbarState()
    } else {
      htmlOverride = null
      setEditorDoc(markdownToDoc(nextMarkdown))
    }

    markdownSourceHtml = null
    markdownSourceValue = null
    markdownSnapshotState = null
    markdownCacheValue = null
    markdownCacheDoc = null

    emitInput(createInputEvent({ skipValidation: true }), editableEl)
    return markdownMode
  }

  const makeButton = ({ option, icon, onClick, isActive }) => {
    if (!actions.has(option) || !SUPPORTED_ACTIONS.has(option)) {
      return null
    }

    const btn = button({
      icon,
      variant: 'ghost',
      class: ['rte-btn', bem.el('rte-btn')],
      tip: linkTip(icon),
      attrs: { 'aria-pressed': 'false' }
    })

    btn._rteIsActive = isActive ?? (() => false)
    btn.addEventListener('mousedown', (event) => event.preventDefault())
    btn.addEventListener('click', (event) => {
      event.preventDefault()
      if (btn.disabled) return
      onClick?.(event)
      updateToolbarState()
    })

    return btn
  }

  toolbar.addEventListener('pointerdown', captureSelection, true)

  const headingBtn = makeButton({
    option: 'heading',
    icon: 'heading',
    onClick: () => toggleHeading(),
    isActive: () => ancestorActive(view.state, schema.nodes.heading, (node) => node.attrs.level === 3)
  })

  const boldBtn = makeButton({
    option: 'bold',
    icon: 'bold',
    onClick: () => runCommand(toggleMark(schema.marks.strong), createInputEvent({ userInteraction: true })),
    isActive: () => markActive(view.state, schema.marks.strong)
  })

  const italicBtn = makeButton({
    option: 'italic',
    icon: 'italic',
    onClick: () => runCommand(toggleMark(schema.marks.em), createInputEvent({ userInteraction: true })),
    isActive: () => markActive(view.state, schema.marks.em)
  })

  const quoteBtn = makeButton({
    option: 'quote',
    icon: 'quote',
    onClick: () => toggleQuote(),
    isActive: () => ancestorActive(view.state, schema.nodes.blockquote)
  })

  const bulletListBtn = makeButton({
    option: 'list',
    icon: 'list',
    onClick: () => toggleList(schema.nodes.bullet_list),
    isActive: () => ancestorActive(view.state, schema.nodes.bullet_list)
  })

  const orderedListBtn = makeButton({
    option: 'list',
    icon: 'list-ordered',
    onClick: () => toggleList(schema.nodes.ordered_list),
    isActive: () => ancestorActive(view.state, schema.nodes.ordered_list)
  })

  const buildLinkTooltip = (anchorEl) => {
    linkInput = input({
      label: 'Link URL',
      placeholder: 'https://example.com',
      onInput: () => linkInput.ok?.(),
      onSubmit: () => {
        const normalized = normalizeUrl(linkInput?.value)
        if (!normalized) {
          linkInput?.error?.('URL is required')
          return
        }

        try {
          new URL(normalized)
        } catch {
          linkInput?.error?.('Invalid URL')
          return
        }

        if (applyLink(normalized)) {
          linkTooltip?.hide?.()
        }
      }
    })

    const applyBtn = button({
      label: 'Apply',
      variant: 'outline',
      onClick: () => {
        const normalized = normalizeUrl(linkInput?.value)
        if (!normalized) {
          linkInput?.error?.('URL is required')
          return
        }

        try {
          new URL(normalized)
        } catch {
          linkInput?.error?.('Invalid URL')
          return
        }

        if (applyLink(normalized)) {
          linkTooltip?.hide?.()
        }
      }
    })

    const cancelBtn = button({
      label: 'Cancel',
      variant: 'ghost',
      onClick: () => linkTooltip?.hide?.()
    })

    const content = col({
      gap: 2,
      children: [
        linkInput,
        row({ gap: 2, end: true }, [cancelBtn, applyBtn])
      ]
    })

    return dialog({
      type: 'tooltip',
      class: bem.el('tooltip'),
      anchor: anchorEl,
      position: 'bottom',
      content,
      onOpen: () => {
        const href = getActiveLinkHref(view.state)
        linkInput.value = href
        linkInput.ok?.()
        setTimeout(() => linkInput.input?.focus(), 0)
      }
    })
  }

  const linkBtn = makeButton({
    option: 'link',
    icon: 'link',
    onClick: () => {
      if (!linkTooltip) {
        linkTooltip = buildLinkTooltip(linkBtn)
      }
      if (linkTooltip.isOpen) {
        linkTooltip.hide()
        return
      }
      linkTooltip.show(linkBtn)
    },
    isActive: () => markActive(view.state, schema.marks.link)
  })

  const unlinkBtn = makeButton({
    option: 'link',
    icon: 'unlink',
    onClick: () => removeLink(),
    isActive: () => false
  })

  const clearBtn = makeButton({
    option: 'clear',
    icon: 'remove-formatting',
    onClick: () => clearFormatting(),
    isActive: () => false
  })

  let markdownToggle = null
  if (actions.has('markdown')) {
    markdownToggle = toggle({
      class: bem.el('markdown-toggle'),
      options: ['rich text', 'markdown'],
      variant: 'minimal',
      onChange: (isMarkdown) => toggleMarkdownMode(isMarkdown)
    })
  }

  row(toolbar, [
    markdownToggle,
    headingBtn,
    boldBtn,
    italicBtn,
    quoteBtn,
    bulletListBtn,
    orderedListBtn,
    linkBtn,
    unlinkBtn,
    clearBtn
  ].filter(Boolean), { end: true, gap: 0 })

  const updateToolbarState = () => {
    toolbar.querySelectorAll('.rte-btn').forEach((btn) => {
      const disabled = markdownMode
      btn.disabled = disabled
      const active = !disabled && typeof btn._rteIsActive === 'function'
        ? btn._rteIsActive()
        : false

      btn.classList.toggle('is-active', !!active)
      btn.setAttribute('aria-pressed', active ? 'true' : 'false')
    })

    if (markdownToggle) {
      markdownToggle.value = markdownMode
    }
  }

  const initialHtml = editableEl.innerHTML || ''
  const initialDoc = htmlToDoc(initialHtml)
  editableEl.innerHTML = ''
  const view = new EditorView(editableEl, {
    state: createState(initialDoc, plugins),
    dispatchTransaction,
    handleDOMEvents: {
      focus: (_view, event) => {
        onFocus?.(editableEl, event)
        return false
      },
      blur: (_view, event) => {
        onBlur?.(editableEl, event)
        return false
      },
      keydown: (_view, event) => {
        onKeydown?.(editableEl, event)
        return !!event.defaultPrevented
      },
      paste: (innerView, event) => {
        if (!plainText) {
          return false
        }

        event.preventDefault()
        const text = event.clipboardData?.getData('text/plain') || ''
        const { from, to } = innerView.state.selection
        const tr = innerView.state.tr
          .insertText(text, from, to)
          .setMeta('fvnEvent', event)
        innerView.dispatch(tr)
        return true
      }
    }
  })

  syncEmptyState()
  updateToolbarState()
  ready = true
  onReady?.()

  const api = {
    toolbar,
    destroy() {
      linkTooltip?.destroy?.()
      toolbar.remove()
      markdownField.remove()
      view?.destroy?.()
      if (editableEl?.[RICH_ADAPTER_INSTANCE_PROP] === api) {
        editableEl[RICH_ADAPTER_INSTANCE_PROP] = null
      }
    },
    isReady() {
      return ready
    },
    setInvalid(isInvalid) {
      markdownField.classList.toggle('invalid', !!isInvalid)
      markdownInput.classList.toggle('invalid', !!isInvalid)
    },
    setLimits,
    getHTML,
    setHTML(html) {
      const nextHtml = String(html || '')
      const nextDoc = htmlToDoc(nextHtml)
      htmlOverride = nextHtml

      if (markdownMode) {
        const nextMarkdown = docToMarkdown(nextDoc)
        markdownInput.value = nextMarkdown
        markdownCacheValue = nextMarkdown
        markdownCacheDoc = nextDoc
      } else {
        setEditorDoc(nextDoc)
      }
    },
    getText() {
      const host = document.createElement('div')
      host.innerHTML = getHTML()
      return host.textContent || ''
    },
    setText(text) {
      const nextHtml = textToHtml(text)
      this.setHTML(nextHtml)
    },
    toMarkdown,
    fromMarkdown(markdown) {
      const value = String(markdown || '')
      const nextDoc = markdownToDoc(value)
      htmlOverride = null

      if (markdownMode) {
        markdownInput.value = value
        markdownCacheValue = value
        markdownCacheDoc = nextDoc
      } else {
        setEditorDoc(nextDoc)
      }
    },
    toggleMarkdownMode,
    isMarkdownMode() {
      return markdownMode
    },
    reset() {
      htmlOverride = null
      markdownInput.value = ''
      markdownCacheValue = ''
      markdownCacheDoc = emptyDoc()
      setEditorDoc(emptyDoc())
      if (markdownMode) {
        emitInput(createInputEvent({ skipValidation: true }), markdownInput)
      }
    },
    focus() {
      if (markdownMode) markdownInput?.focus()
      else focusRichEditor()
    }
  }

  editableEl[RICH_ADAPTER_INSTANCE_PROP] = api
  return api
}
