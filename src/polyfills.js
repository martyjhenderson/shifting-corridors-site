// Polyfills for Node.js core modules
import { Buffer } from 'buffer';
import process from 'process';

if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
  globalThis.process = process;
}

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.process = process;
}