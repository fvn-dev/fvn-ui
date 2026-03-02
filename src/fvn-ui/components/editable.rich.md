# bareBonesRichText

Standalone dependency-free rich text connector for any `contenteditable` element.

## API

```js
import withRichText from "./connect-rich-text-editor.js";

const editor = withRichText(contentEditableElement);

editor.toggle("bold");
editor.toggle("italic");
editor.toggle("heading");
editor.toggle("quote");
editor.toggle("list");
editor.toggle("link", "https://example.com");
editor.toggle("link", null); // remove
editor.resume(); // focus + restore last known selection/caret
const rect = editor.position(); // { x, y, w, h } | null

editor.listen((state) => {
  console.log(state);
});
```

State shape:

```js
{
  bold: false,
  italic: false,
  heading: false,
  list: false,
  link: false,
  href: null,
  quote: false
}
```

## Behavior

- `toggle(...)` always restores editor focus/selection after each command (including toolbar-click blur cases).
- If bold is toggled on with no selection, next typed characters are bold (native browser behavior).
- For bold/italic collapsed toggles:
  - pre-toggle while writing means "from now until next toggle"
  - clicking inside existing formatted text toggles that section
  - range selection toggles only the selected range
- Pressing `Enter` outside a list resets formatting to plain paragraph and untoggles bold/italic/link.
- Pressing `Enter` inside a list keeps native list behavior:
  - first Enter creates next list item
  - Enter again on empty list item exits the list
- `position()` returns viewport coordinates from current in-editor selection/caret; returns `null` when no in-editor anchor exists.

## Demo

Open [demo.html](/Users/frodenordbo/Downloads/briefeditor-main/bareBonesRichText/demo.html) in a browser.
