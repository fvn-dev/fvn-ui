import './main.css';
import apiDocs from '../docs/api.json';
import { version } from '../package.json';
import { dom, el, editable, dashboard, layout, card, input, textarea, selectComponent, switchComponent, tabs, buttonGroup, confirm, toggle, tooltip, button, checkbox, radio, avatar, colors, collapsible, text } from './fvn-ui'

function init() {
  const darkmodeIcons = [ 'moon', 'sun' ];
  if (matchMedia('(prefers-color-scheme: dark)').matches) {
    darkmodeIcons.reverse();
  }

  dashboard(document.body, {
    id: 'dash',
    title: 'FVN-UI',
    description: `v${version}`,
    menu: [
      { icon: 'doc', view: 'doc' },
      { icon: [ 'rabbit', 'bird' ], action: () => document.body.classList.toggle('shaded') },
      { icon: darkmodeIcons, action: () => document.documentElement.classList.toggle('dark') }
    ],
    views: {
      default: () => presentation(),
      doc: () => docs()
    }
  });

  card(dom.dash, {  
    title: 'Card component',
    description: `Look at the <a href="https://github.com/fvn-dev/fvn-ui/blob/main/src/main.js#L12" target="_blank">source code</a> for this page to see examples of how to use the components`,
    width: 'full',
    content: `
      <div class="flex justify-between w-full">
        <label class="ui-component ui-label">fvn-dev</label>
        <a class="small" href="https://github.com/fvn-dev/fvn-ui" target="_blank">Github</a>
      </div>  
    `
  });
}

init();

// --->

function presentation(body) {
  return tabs(body, {
    variant: 'outline',
    items: [
      {
        label: 'Button',
        render: buttonPresentation
      },
      {
        label: 'Select',
        render: selectPresentation
      },
      {
        label: 'Input',
        render: inputPresentation
      },
      {
        label: 'Check / Switch/ Toggle',
        render: togglesPresentation
      },      
      {
        label: 'Tabs',
        render: tabsPresentation
      },    
      {
        label: 'Dialog',
        render: dialogPresentation
      },
      {
        label: 'Collapsible',
        render: collapsibleresentation
      },                    
      {
        label: 'Avatar',
        render: avatarPresentation
      },
      {
        label: 'Misc',
        render: miscPresentation
      }
    ]
  });   
}

// --->

const exampleOptions = [
  { value: 0, label: 'Apple' },
  { value: 1, label: 'Banana' },
  { value: 2, label: 'Orange' },
  { value: 3, label: 'Lychee', disabled: true },        
  { value: 4, label: 'Mango' },
  { value: 5, label: 'Pineapple' },
  { value: 6, label: 'Strawberry' },
  { value: 7, label: 'Watermelon' },
  { value: 8, label: 'Grapes' },
  { value: 9, label: 'Blueberry' },
  { value: 10, label: 'Peach' },
  { value: 11, label: 'Cherry' },
  { value: 12, label: 'Pear' }
];

// --->

function buttonPresentation() {
  const a = layout.row([
    button({ label: 'Default' }),
    button({ label: 'Primary', variant: 'primary' }),
    button({ label: 'Secondary', variant: 'secondary' }),
    button({ label: 'Outline', variant: 'outline' }),
    button({ label: 'Ghost', variant: 'ghost' }),
    button({ label: 'Minimal', variant: 'minimal' })
  ]);
  const b = layout.row([
    button({ label: 'Colored', color: 'red' }),
    button({ label: 'Colored outline', variant: 'outline', color: 'primary' }),
    button({ label: 'Ghost round', shape: 'round', variant: 'ghost', color: 'yellow' }),
    button({ label: 'Primary round', shape: 'round',color: 'primary' }),
    button({ label: 'Loading', shape: 'round', variant: 'secondary', className: 'loading' }),
  ]);
  const c = layout.row([
    button({ icon: 'settings', label: 'Settings' }),
    button({ icon: 'search', label: 'Search', shape: 'round', variant: 'secondary' }),
    button({ icon: 'settings', variant: 'outline' }),
    button({ icon: 'settings', shape: 'round', color: 'red', variant: 'outline' }),
    button({ icon: 'settings', shape: 'round', variant: 'ghost' })
  ]);
  const d = layout.row([
    button({ label: 'Random', color: colors }),
    button({ label: 'Green', color: 'green', variant: 'outline' }),
    button({ label: 'Yellow', color: 'yellow' }),
    button({ label: 'Orange', color: 'orange' }),
    button({ label: 'Blue', color: 'blue', variant: 'ghost' }),
    button({ label: 'Pink', color: 'pink', shape: 'round' })
  ]);
  
  return tabs({
    border: false,
    padding: false,
    variant: 'minimal',
    items: [
      {
        label: 'Core',
        render: () => a
      },
      {
        label: 'Variants',
        render: () => b
      },    
      {
        label: 'Icon',
        render: () => c
      },
      {
        label: 'Colors',
        render: () => d
      },      
    ]
  })  
}

// --->

function togglesPresentation() {
  return layout.row({ justify: 'between', gap: 8 }, [
    layout.col([text.label('Checkbox', { soft: true }), checkboxPresentation()]), 
    layout.col([radioPresentation()]),    
    layout.col({ gap: 3 }, [
      switchComponent({
        label: 'Switch default'
      }),
      switchComponent({
        label: 'Switch red',
        color: 'red',
        checked: true
      }),
      switchComponent({
        label: 'Switch primary',
        color: 'primary',
        checked: true
      })
    ]),
    layout.col({ gap: 3 }, [
      toggle({ 
        options: ['Off', 'On'], 
      }),
      toggle({ 
        options: ['With', 'Color'], 
        color: 'primary',
        checked: true
      })       
    ])
  ]);
}

// --->

function checkboxPresentation() {
  return layout.col(exampleOptions.slice(0, 4).map(({ label, value, disabled }, i) => checkbox({
    label,
    value,
    disabled,
    checked: i === 1 || i === 2,
    color: i === 2 && 'blue'
  })));
}

// --->

function radioPresentation() {
  return layout.col([
    radio({
      label: 'Radio group',
      value: 0,
      color: 'primary',
      items: exampleOptions.slice(0, 4)
    })
  ]);
}

// --->

function selectPresentation() {
  return layout.col({ gap: 6 }, [
    layout.row([
      selectComponent({
        label: 'Pick a fruit',
        options: exampleOptions.slice(0, 5),
        value: 1
      }),
      selectComponent({
        label: '&nbsp;',
        options: exampleOptions.slice(0, 5),
        placeholder: 'Pick a fruit'
      })
    ]),
    selectComponent({
      label: 'Multiselect with filter',
      multiselect: true,
      filter: true,
      value: [1, 4],
      options: exampleOptions,
      placeholder: 'Pick fruits'
    })    
  ]);
}

// --->

function inputPresentation() {
  return layout.col({ gap: 6 }, [
    layout.row({ width: 'full' }, [
      input({
        label: 'Standard',
        placeholder: 'Text input'
      }),
      input({
        label: 'Submit',
        placeholder: 'Text input with submit',
        flex: 1,
        onsubmit() {
          this.style.borderColor = 'var(--primary)';
          setTimeout(() => this.style.borderColor = '', 2000);
        }
      })
    ]),
    layout.row({ width: 'full' }, [
      input({
        label: 'Size large',
        placeholder: 'Text input',
        size: 'large',
        flex: 1,
        onsubmit() {
          this.style.borderColor = 'var(--primary)';
          setTimeout(() => this.style.borderColor = '', 2000);
        }
      })
    ]), 
    layout.row({ width: 'full' }, [
      textarea({
        label: 'Textarea',
        placeholder: 'Textarea input',
        flex: 1
      })
    ]),
    input({
      label: 'Number',
      type: 'number',
      width: 'full',
      min: 3,
      max: 7,
      clamp: true, // todo! implement clamping in the component
      placeholder: 3
    }),   
    editable({ 
      label: 'Contenteditable { plain: true }',
      placeholder: 'Faux text input...',
      rows: 1,
      plain: true
    }) 
  ]);
}

// --->

function dialogPresentation() {
  return layout.col({ gap: 4 }, [
    confirm({
      type: 'tooltip',
      label: 'Tooltip',
      variant: 'outline',
      title: 'How do you feel at this very moment?',
      description: 'Be honest!',
      confirm: 'Horrible',
      cancel: 'Awesome',
    }),
    confirm({
      label: 'Modal',
      variant: 'outline',
      confirmColor: 'red',
      title: 'Are you absolutely sure?',
      description: 'This action cannot be undone',
      confirm: 'Delete',
      cancel: 'Cancel'
    }),
    confirm({
      label: 'Modal inverted',
      variant: 'outline',
      title: 'Are you absolutely sure?',
      description: 'This action cannot be undone',
      confirm: 'Delete',
      cancel: 'Cancel',
      inverted: true
    }),
    button({
      label: 'Mouseover',
      variant: 'outline',
      onmouseenter: e => tooltip({ 
        inverted: true, 
        color: 'yellow',
        open: e, 
        content: card({
          border: false,
          padding: 4,
          style: {
            width: '300px'
          },
          justify: 'center',
          align: 'center',
          title: 'How do you feel at this very moment?',
          description: 'Be honest!',
          content: button({ flex: 0, label: 'Awesome', shape: 'round', color: 'yellow' })
        })
      }),      
    })      
  ]);
}

// --->

function avatarPresentation() {
  const src = 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=100&auto=format&fit=crop&q=60';
  return layout.row({ gap: 10 }, [
    layout.col([
      avatar({ src, name: 'Jolly Holyfield', description: 'Developer' }),
      avatar({ name: 'Jane Doe', description: 'Designer', color: 'pink' }),
      avatar({ name: 'Alex', variant: 'square', color: 'blue' }),
    ]),
    layout.col([
      avatar({ name: 'John Smith', description: 'Designer', color: 'green', size: 'medium' }),
    ]),    
    layout.col([
      avatar({ src, name: 'Jolly Holyfield', description: 'Developer', variant: 'square', size: 'large' }),
    ])        
  ])
}

// --->

function collapsibleresentation() {
  return layout.col([
    collapsible({
      label: 'Disabled',
      disabled: true
    }),    
    collapsible({
      label: 'Click to expand',
      content: card({
        title: 'Card component',
        description: 'With a description',
      })
    })
  ]);
}

// --->

function tabsPresentation() {
  return layout.col({ gap: 8 }, ['outline', 'border', 'minimal', 'default', 'ghost', 'ghost'].map((variant, i) => {
    const c = {
      variant,
      center: i % 2 !== 0,
      color: variant === 'border' && 'red',
      shade: i > 1,
      shape: i === 3 && 'round',
      padding: 6
    };
    
    if (i > 3) {
      const txt = text.label({ muted: true, small: true }, `As ${i === 5 ? 'shaded ' : ''}button group`);
      return layout.row({ justify: 'between', width: 'full' }, [
        buttonGroup({
          ...c,
          shape: i === 5 && 'round',
          color: i === 4 && 'blue',
          shade: i === 5,
          width: 'auto',
          active: i === 5 ? 1 : 0,
          callback(active) {
            txt.innerHTML = 'Callback from ' + active;
          },
          items: [
            {
              label: 'One',
              icon: 'moon',
              color: i === 5 && 'green'
            },
            {
              label: 'Two',
              icon: 'sun',
              color: i === 5 && 'pink'
            },    
            {
              label: 'Three',
              icon: 'user',
              color: i === 5 && 'yellow'
            }
          ]
        }),
        txt
      ]);
    }

    const small = str => `<small>${str}</small>`;
    const content = Object.entries(c)
      .map(([k, v]) => v && `${k}: <b>${v}</b>`)
      .filter(Boolean)
      .join('<br>');
    const fill = char => content
      .split('<br>')
      .map(c => Array(c.length).fill(char).join(''))
      .join('<br>');

    return tabs({
      ...c,
      items: [
        {
          label: 'One',
          render: () => small(content)
        },
        {
          label: 'Two',
          render: () => small(fill('-'))
        },    
        {
          label: 'Three',
          render: () => small(fill('='))
        }
      ]
    })
  }));
}

// ---> 

function miscPresentation() {
  return layout.col({ gap: 6 }, [
    layout.row(colors.map(c => el(`<div data-ui-col="${c}" class="color-swatch">${c}</div>`))),
    text.header({ title: 'Large header', description: 'With a description', large: true }),
    text.header({ title: 'Normal header', description: 'with a description' }),
    text.label('Label'), 
    text.label('Soft label', { soft: true }),
  ]);
}

// ---> render docs from api.json

function docs() {
  const getDescription = (doc) => {
    if (!doc.description?.children?.[0]?.children?.[0]?.value) return '';
    return doc.description.children[0].children[0].value;
  };

  const formatType = (typeObj) => {
    if (!typeObj) return 'any';
    
    // Simple named type: string, boolean, Function, etc.
    if (typeObj.type === 'NameExpression') {
      return typeObj.name;
    }
    
    // String literal: 'round'
    if (typeObj.type === 'StringLiteralType') {
      return `'${typeObj.value}'`;
    }
    
    // Union type: 'a'|'b'|'c' - check if it's a colors union
    if (typeObj.type === 'UnionType') {
      const values = typeObj.elements
        .filter(e => e.type === 'StringLiteralType')
        .map(e => e.value);
      
      // Check if this looks like a colors union (has at least 3 color names)
      const colorMatches = values.filter(v => colors.includes(v));
      if (colorMatches.length >= 3) {
        // It's a colors type - return reference
        const extras = typeObj.elements.filter(e => e.type !== 'StringLiteralType');
        if (extras.length) {
          return `color | ${extras.map(formatType).join(' | ')}`;
        }
        return 'color';
      }
      
      return typeObj.elements.map(formatType).join(' | ');
    }
    
    // Optional type: unwrap and recurse
    if (typeObj.type === 'OptionalType') {
      return formatType(typeObj.expression);
    }
    
    // Array/generic: Array<string>
    if (typeObj.type === 'TypeApplication') {
      const base = formatType(typeObj.expression);
      const args = typeObj.applications?.map(formatType).join(', ') || '';
      return `${base}<${args}>`;
    }
    
    // Object with properties: {value: string, label: string}
    if (typeObj.type === 'RecordType') {
      const fields = typeObj.fields?.map(f => `${f.key}: ${formatType(f.value)}`).join(', ') || '';
      return `{${fields}}`;
    }
    
    // Fallback to name if available
    return typeObj.name || 'any';
  };

  const getParams = (doc) => {
    return doc.tags
      ?.filter(t => t.title === 'param')
      .map(t => ({
        name: t.name,
        description: t.description || '',
        type: formatType(t.type),
        optional: t.type?.type === 'OptionalType'
      })) || [];
  };

  const getReturns = (doc) => {
    const ret = doc.tags?.find(t => t.title === 'returns');
    return ret?.description || '';
  };

  const getExamples = (doc) => {
    return doc.tags
      ?.filter(t => t.title === 'example')
      .map(t => t.description) || [];
  };

  const renderDoc = (doc) => {
    const params = getParams(doc);
    const returns = getReturns(doc);
    const examples = getExamples(doc);

    return collapsible({
      width: 'full',
      label: `<b>${doc.name.replace('Component', '')}</b> <span class="muted small">${getDescription(doc)}</span>`,
      content: card({ content: layout.col({ gap: 4 }, [
        params.length && el('div', {
          width: 'full',
          children: [
            text.label('Parameters'),
            el('table', { class: 'docs-table', html: params.map(p => `
              <tr>
                <td data-ui-col="red">${p.name}</td>
                <td class="muted small">${p.type}${p.optional ? '?' : ''}</td>
                <td class="small">${p.description}</td>
              </tr>
            `).join('') })
          ]
        }),
        returns && el('div', {
          children: [
            text.label('Returns'),
            el('span', { class: 'small', text: returns })
          ]
        }),
        examples.length && el('div', {
          children: [
            text.label('Examples'),
            el('code', { class: 'demo-code', text: examples.join('\n\n') })
          ]
        })
      ].filter(Boolean)) })
    })
  };

  const textFunctionNames = ['title', 'description', 'label', 'header'];
  const isPrivate = d => d.tags?.some(t => t.title === 'private');
  const componentDocs = apiDocs.filter(d => 
    d.name
    && !isPrivate(d)
    && !d.tags?.some(t => t.title === 'category' && t.description === 'Layout')
    && !textFunctionNames.includes(d.name)
    && d.name !== 'text'
  );
  const layoutDocs = apiDocs.filter(d => 
    d.name
    && !isPrivate(d)
    && d.tags?.some(t => t.title === 'category' && t.description === 'Layout')
    && !textFunctionNames.includes(d.name)
    && d.name !== 'text'
  );
  const textDocs = apiDocs.filter(d => d.name && textFunctionNames.includes(d.name));

  const renderTextGroup = () => {
    if (!textDocs.length) return null;
    return collapsible({
      width: 'full',
      label: `<b>text</b> <span class="muted small">Text primitives (title, description, label, header)</span>`,
      content: card({ content: layout.col({ gap: 2 }, textDocs.map(renderDoc)) })
    });
  };

  const renderConstants = () => {
    return el('div', {
      children: [
        el('table', { class: 'docs-table', html: `
          <tr>
            <td data-ui-col="red">colors</td>
            <td class="muted small">string[]</td>
            <td class="small">${colors.map(c => `'${c}'`).join(', ')}</td>
          </tr>
        ` })
      ]
    });
  };

  return card({ content: layout.col({ gap: 4, width: 'full' }, [
    text.title('Documentation / JSDoc'),
    text.label('Components', { muted: true }),
    layout.col({ gap: 2, width: 'full' }, componentDocs.map(renderDoc)),
    layoutDocs.length && text.label('Layout', { muted: true }),
    layout.col({ gap: 2 }, [
      ...layoutDocs.map(renderDoc),
      renderTextGroup()
    ].filter(Boolean)),
    text.label('Constants', { muted: true }),
    renderConstants()
  ].filter(Boolean)) });
}