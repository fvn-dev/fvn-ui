import './main.css';
import apiDocs from '../docs/api.json';
import { dom, el, dashboard, layout, card, input, selectComponent, switchComponent, tabs, buttonGroup, confirm, toggle, tooltip, button, checkbox, radioGroup, avatar, colors, collapsible, text } from './fvn-ui'

function init() {
  dashboard(document.body, {
    id: 'dash',
    title: 'FVN-UI beta',
    description: 'Diverse junk',
    menu: [
      { icon: 'doc', view: 'doc' },
      { icon: 'rabbit', action: () => document.body.classList.toggle('shaded') },
      { icon: 'moon', action: () => document.documentElement.classList.toggle('dark') }
    ],
    views: {
      default: () => presentation(),
      doc: () => docs()
    }
  });

  card(dom.dash, {  
    title: 'Card component',
    description: `Yeah I'm rollin' down Rodeo wit a shotgun. These people ain't seen a brown skin man since their grandparents bought one.`,
    content: `
      <div class="flex justify-between w-full">
        <label class="ui-component ui-label">Zach</label>
        <a class="small" href="https://github.com/fvn-dev/fvn-ui">Github</a>
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
        label: 'Switch',
        render: switchPresentation
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
        label: 'Check / Radio',
        render: checkAndRadioPresentation
      },
      {
        label: 'Avatar',
        render: avatarPresentation
      },
      {
        label: 'Collapsible',
        render: collapsibleresentation
      },
      {
        label: 'Tabs',
        render: tabsPresentation
      },      
      {
        label: 'Dialog',
        render: dialogPresentation
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
    button({ label: 'Ghost pill', shape: 'pill', variant: 'ghost', color: 'yellow' }),
    button({ label: 'Primary pill', shape: 'pill',color: 'primary' }),
    button({ label: 'Loading', shape: 'pill', variant: 'secondary', className: 'loading' }),
  ]);
  const c = layout.row([
    button({ icon: 'settings', label: 'Settings' }),
    button({ icon: 'search', label: 'Search', shape: 'pill', variant: 'secondary' }),
    button({ icon: 'settings', variant: 'outline' }),
    button({ icon: 'settings', shape: 'pill', color: 'red', variant: 'outline' }),
    button({ icon: 'settings', shape: 'pill', variant: 'ghost' })
  ]);
  const d = layout.row([
    button({ label: 'Random', color: colors }),
    button({ label: 'Green', color: 'green', variant: 'outline' }),
    button({ label: 'Yellow', color: 'yellow' }),
    button({ label: 'Orange', color: 'orange' }),
    button({ label: 'Blue', color: 'blue', variant: 'ghost' }),
    button({ label: 'Pink', color: 'pink', shape: 'pill' })
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

function switchPresentation() {
  return layout.col([
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
    }),
    text.label('&nbsp;'),
    toggle({ 
      options: ['Off', 'On'], 
    }),
    toggle({ 
      options: ['With', 'Color'], 
      color: 'primary',
      checked: true
    })       
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
    radioGroup({
      value: 0,
      color: 'primary',
      items: exampleOptions.slice(0, 4)
    })
  ]);
}

// --->

function checkAndRadioPresentation() {
  return layout.row({ gap: 10 }, [ 
    layout.col([text.label('Checkbox'), checkboxPresentation()]), 
    layout.col([text.label('Radio group'), radioPresentation()])
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
        placeholder: 'Textinput'
      }),
      input({
        label: 'Submit',
        placeholder: 'Textinput with submit',
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
        placeholder: 'Textinput',
        size: 'large',
        flex: 1,
        onsubmit() {
          this.style.borderColor = 'var(--primary)';
          setTimeout(() => this.style.borderColor = '', 2000);
        }
      })
    ]),    
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
          title: 'How do you feel at this very moment?',
          description: 'Be honest!',
          content: button({ flex: 0, label: 'Awesome', shape: 'pill', color: 'yellow' })
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
        title: 'Expanded',
        description: 'view',
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
      shape: i === 3 && 'pill'
    };
    
    if (i > 3) {
      const txt = text.label({ muted: true, small: true }, `As ${i === 5 ? 'shaded ' : ''}button group`);
      return layout.row({ justify: 'between', width: 'full' }, [
        buttonGroup({
          ...c,
          padding: 2,
          shape: i === 5 && 'pill',
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
      padding: 2,
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

function docs() {
  const getDescription = (doc) => {
    if (!doc.description?.children?.[0]?.children?.[0]?.value) return '';
    return doc.description.children[0].children[0].value;
  };

  const getParams = (doc) => {
    return doc.tags
      ?.filter(t => t.title === 'param')
      .map(t => ({
        name: t.name,
        description: t.description || '',
        type: t.type?.name || t.type?.expression?.name || 'any',
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
      label: `<b>${doc.name}</b> <span class="muted small">${getDescription(doc)}</span>`,
      content: card({ content: layout.col({ gap: 4 }, [
        params.length && el('div', {
          width: 'full',
          children: [
            text.label('Parameters'),
            el('table', { class: 'docs-table', html: params.map(p => `
              <tr>
                <td><code>${p.name}</code></td>
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
  const componentDocs = apiDocs.filter(d => 
    d.name
    && !d.tags?.some(t => t.title === 'category' && t.description === 'Layout')
    && !textFunctionNames.includes(d.name)
    && d.name !== 'text'
  );
  const layoutDocs = apiDocs.filter(d => 
    d.name
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

  return card({ content: layout.col({ gap: 4 }, [
    text.title('Documentation / JSDoc'),
    text.label('Components', { muted: true }),
    layout.col({ gap: 2 }, componentDocs.map(renderDoc)),
    layoutDocs.length && text.label('Layout', { muted: true }),
    layout.col({ gap: 2 }, [
      ...layoutDocs.map(renderDoc),
      renderTextGroup()
    ].filter(Boolean))
  ].filter(Boolean)) });
}