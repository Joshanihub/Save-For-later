import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

// Polyfill TextEncoder/TextDecoder for jsdom
Object.assign(global, { TextDecoder, TextEncoder });

// Polyfill crypto.subtle for jsdom (Node 16+ provides webcrypto)
if (!global.crypto || !global.crypto.subtle) {
  Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

// Mock window.matchMedia for theme testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress noisy React warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
