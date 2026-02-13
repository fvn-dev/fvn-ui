/**
 * fvn-ui — Browser bundle entry point
 * This file is used for the IIFE build that can be loaded via <script> tag
 * CSS is injected automatically when this script loads
 */

// Import everything from the main module
import * as ui from './index.js'

// Expose to global scope
if (typeof window !== 'undefined') {
  window.ui = ui
}

export default ui
