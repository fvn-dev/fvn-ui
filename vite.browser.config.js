import { defineConfig } from 'vite';
import { resolve } from 'path';

// Plugin to inject CSS directly into the JS bundle
function cssInlinePlugin() {
  return {
    name: 'css-inline',
    enforce: 'post',
    generateBundle(options, bundle) {
      // Find and extract CSS
      let cssCode = '';
      const cssFiles = [];
      
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css')) {
          cssCode += chunk.source;
          cssFiles.push(fileName);
        }
      }
      
      // Remove CSS files from bundle
      cssFiles.forEach(f => delete bundle[f]);
      
      // Inject CSS into JS
      if (cssCode) {
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            const cssInjector = `(function(){var d=document,s=d.createElement("style");s.textContent=${JSON.stringify(cssCode)};d.head.appendChild(s)})();`;
            chunk.code = cssInjector + chunk.code;
          }
        }
      }
    }
  };
}

// Config for building the browser IIFE bundle with CSS inlined
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/fvn-ui/browser.js'),
      name: 'fvnUI',
      formats: ['iife'],
      fileName: () => 'fvn-ui.js'
    },
    cssCodeSplit: false,
    minify: 'esbuild'
  },
  plugins: [cssInlinePlugin()]
});
