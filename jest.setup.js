import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { loadEnvConfig } from '@next/env';

// Load environment variables for testing
loadEnvConfig(process.cwd());

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock uuid module to avoid ES module issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234-5678'),
}));

// Mock uncrypto module to avoid ES module issues
jest.mock('uncrypto', () => ({
  default: global.crypto,
  getRandomValues: (array) => global.crypto.getRandomValues(array),
  randomUUID: () => global.crypto.randomUUID(),
  subtle: global.crypto.subtle,
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
  useParams() {
    return {};
  },
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
  useLocale: () => 'ru',
}));

// Mock framer-motion to disable animations in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(function MotionDiv({ children, ...props }, ref) {
        const {
          initial,
          animate,
          exit,
          whileHover,
          whileTap,
          transition,
          ...otherProps
        } = props;
        return React.createElement('div', { ref, ...otherProps }, children);
      }),
      span: React.forwardRef(function MotionSpan({ children, ...props }, ref) {
        const {
          initial,
          animate,
          exit,
          whileHover,
          whileTap,
          transition,
          ...otherProps
        } = props;
        return React.createElement('span', { ref, ...otherProps }, children);
      }),
      button: React.forwardRef(function MotionButton(
        { children, ...props },
        ref
      ) {
        const {
          initial,
          animate,
          exit,
          whileHover,
          whileTap,
          transition,
          ...otherProps
        } = props;
        return React.createElement('button', { ref, ...otherProps }, children);
      }),
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Mock Next.js server globals (Request, Response, Headers, etc.)
// Use simple mocks instead of importing from undici to avoid ReadableStream issues
global.Request = class Request {
  constructor(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method || 'GET';
    const headers = new global.Headers(init?.headers || {});
    const body = init?.body;

    // Use Object.defineProperty to create read-only properties
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      enumerable: true,
    });
    Object.defineProperty(this, 'method', {
      value: method,
      writable: false,
      enumerable: true,
    });
    Object.defineProperty(this, 'headers', {
      value: headers,
      writable: false,
      enumerable: true,
    });
    Object.defineProperty(this, 'body', {
      value: body,
      writable: false,
      enumerable: true,
    });
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new global.Headers(init?.headers || {});
    this.ok = this.status >= 200 && this.status < 300;
  }

  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  }

  async json() {
    return JSON.parse(this.body);
  }
};

global.Headers = class Headers {
  constructor(init) {
    this.map = new Map();
    if (init) {
      if (init instanceof Headers) {
        init.map.forEach((value, key) => this.map.set(key, value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), String(value));
        });
      }
    }
  }

  get(name) {
    return this.map.get(name.toLowerCase()) || null;
  }

  set(name, value) {
    this.map.set(name.toLowerCase(), String(value));
  }

  has(name) {
    return this.map.has(name.toLowerCase());
  }

  delete(name) {
    this.map.delete(name.toLowerCase());
  }

  forEach(callback) {
    this.map.forEach((value, key) => callback(value, key, this));
  }
};

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch for API tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
  })
);

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
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
