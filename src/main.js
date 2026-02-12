import './main.css';
import codeExample from './main.txt?raw';
import { dom, el, dashboard, layout, card, input, label, selectComponent, switchComponent, tabs, buttonGroup, confirm, toggle, tooltip, button, checkbox, radioGroup, avatar, colors } from './fvn-ui'
import { collapsible } from './fvn-ui/components/collapsible';

function init() {
  dashboard(document.body, {
    id: 'dash',
    title: 'FVN-UI beta',
    description: 'Diverse junk',
    menu: [
      { icon: 'code', view: 'code' },
      { icon: 'rabbit', action: () => document.body.classList.toggle('shaded') },
      { icon: 'moon', action: () => document.documentElement.classList.toggle('dark') },
      { icon: 'dots', view: 'demo' }
    ],
    views: {
      default: () => exampleTabs(),
      code: () => card(dom.dash, { content: el('code', { class: 'demo-code', text: codeExample }) }),
      demo: () => examplePresentation()
    }
  });

  card(dom.dash, {  
    title: 'Card component',
    description: `Yeah I'm rollin' down Rodeo wit a shotgun. These people ain't seen a brown skin man since their grandparents bought one.`,
    content: `
      <div class="flex justify-between">
        <label class="ui-component ui-label">Zach</label>
        <a class="small" href="https://github.com/fvn-dev/fvn-ui">Github</a>
      </div>  
    `
  });
}

init();

// --->

function exampleTabs(body) {
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
    label('&nbsp;'),
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
    layout.col([label('Checkbox'), checkboxPresentation()]), 
    layout.col([label('Radio group'), radioPresentation()])
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
  return layout.col({ gap: 4, align: 'center' }, [
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
      const txt = label({ muted: true, small: true }, `As ${i === 5 ? 'shaded ' : ''}button group`);
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

function examplePresentation() {
  const pillButton = label => button({ 
    label,
    variant: 'outline', 
    shape: 'pill', 
    color: 'primary',
    onclick() {
      this.toggleLoading('Henter noe');
      setTimeout(() => this.toggleLoading(), 2000);
    }
  });

  return layout.col({ border: true, align: 'center', justify: 'center', block: 10, gap: 3 }, [
    label('Omtrent', { block: 2 }),
    pillButton('Det'),
    pillButton('Samme'),
    pillButton('Utseendet')
  ]);
}
