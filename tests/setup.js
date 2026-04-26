process.env.NODE_ENV = 'test';
const { TextEncoder, TextDecoder } = require('util');

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

// Keep test logs readable while preserving errors.
const originalLog = console.log;
const originalWarn = console.warn;

beforeAll(() => {
  console.log = (...args) => {
    if (process.env.TEST_VERBOSE === 'true') {
      originalLog(...args);
    }
  };
  console.warn = (...args) => {
    if (process.env.TEST_VERBOSE === 'true') {
      originalWarn(...args);
    }
  };
});

afterAll(() => {
  console.log = originalLog;
  console.warn = originalWarn;
});
