```html
<body>
  <ui-row gap="2" align="center">
    <ui-button text="Click me" variant="primary"></ui-button>
    <ui-switch label="Dark mode"></ui-switch>
  </ui-row>
</body>
```
```js
import { autoProcess } from './fvn-ui'
autoProcess()
```

---

```js
import { template } from './fvn-ui'

const ui = template`
  <ui-row gap="2">
    <ui-button text="Save" variant="primary"></ui-button>
    <ui-button text="Cancel" variant="ghost"></ui-button>
  </ui-row>
`
document.body.appendChild(ui)
```
