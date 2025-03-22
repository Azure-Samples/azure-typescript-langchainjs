// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Import OpenAI shims for Node.js environment
import 'openai/shims/node';

// Mock fetch globally
global.fetch = jest.fn();

// Add Web API classes if they don't exist in the global scope
if (typeof global.Request === 'undefined') {
  global.Request = class Request {};
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.init = init;
      this.status = init?.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
    }

    json() {
      return Promise.resolve(JSON.parse(this.body));
    }
  };
}

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {};
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(data) {
      return data;
    }
  };
}

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(data) {
      return data;
    }
  };
}

// Mock NextResponse
jest.mock('next/server', () => {
  return {
    ...jest.requireActual('next/server'),
    NextResponse: {
      json: jest.fn().mockImplementation((body, init) => {
        return {
          status: init?.status || 200,
          json: () => Promise.resolve(body),
        };
      }),
    },
  };
});
