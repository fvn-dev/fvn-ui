import { el, parseArgs, configToClasses, bemFactory } from '../dom.js'
import './image.css'

const bem = bemFactory('image');

const loadImage = (container) => {
  const img = container.querySelector('img');
  if (!img?.dataset.src) {
    return;
  }
  img.src = img.dataset.src;
  delete img.dataset.src;
};

const observer = new IntersectionObserver((entries, obs) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) {
      continue;
    }
    loadImage(entry.target);
    obs.unobserve(entry.target);
  }
}, { rootMargin: '100% 0px' });

/**
 * Creates a lazy-loading image
 * @param {Object} config
 * @param {string} config.src - Image URL
 * @param {string} [config.alt=''] - Alt text
 * @param {boolean} [config.lazy=true] - Enable lazy loading
 * @param {string} [config.id] - Registers to dom.image[id] and dom[id]
 * @returns {HTMLDivElement} Image container (sets data-loaded="true" on load)
 * @example
 * image({ src: 'photo.jpg', alt: 'A photo' })
 * image({ src: 'hero.jpg', lazy: false })  // Load immediately
 */
export function image(...args) {
  const {
    parent,
    src,
    alt = '',
    lazy = true,
    props,
    ...rest
  } = parseArgs(...args);

  const root = el('div', parent, {
    ...rest,
    class: [bem(), configToClasses(props), rest.class],
    children: [
      el('img', {
        class: bem.el('img'),
        alt,
        ...(lazy ? { data: { src } } : { src }),
        onLoad: () => root.dataset.loaded = 'true',
        onError: () => root.dataset.error = 'true'
      })
    ]
  });

  if (lazy) {
    requestAnimationFrame(() => {
      const rect = root.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 2 && rect.bottom > 0;
      inView ? loadImage(root) : observer.observe(root);
    });
  }

  return root;
}
