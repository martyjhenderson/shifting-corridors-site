// Basic polyfills for browser compatibility
if (typeof globalThis === 'undefined') {
  // @ts-ignore
  window.globalThis = window;
}