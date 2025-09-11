import '@testing-library/jest-dom';

// Полифилл для fetch в Node.js тестах
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      ok: true,
      status: 200,
      statusText: 'OK',
    })
  ) as jest.Mock;
}
